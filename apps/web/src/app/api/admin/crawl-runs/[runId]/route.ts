import { NextRequest, NextResponse } from "next/server";
import {
  DocumentData,
  DocumentReference,
  FieldValue,
  Transaction,
} from "firebase-admin/firestore";
import { verifyBearerToken } from "@/lib/server/auth";
import { db } from "@/lib/server/firebaseAdmin";
import {
  appendCrawlRunEvent,
  getCrawlRun,
  listCrawlRunEvents,
} from "@/lib/server/crawlRuns";

const SUPPORTED_PLATFORMS = new Set([
  "facebook",
  "threads",
  "tiktok",
  "youtube",
  "google_maps",
  "news_html",
  "website",
]);

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function stringList(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .map((item) => text(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems))];
}

async function requireAdmin(request: NextRequest) {
  const token = await verifyBearerToken(request.headers.get("authorization"));
  if (!token) return false;
  const profile = await db.collection("users").doc(token.uid).get();
  return (profile.data()?.role || token.role) === "admin";
}

export async function GET(
  request: NextRequest,
  context: { params: { runId: string } },
) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const run = await getCrawlRun(context.params.runId);
    if (!run) return NextResponse.json({ error: "Crawl run not found" }, { status: 404 });
    const rawLimit = Number(request.nextUrl.searchParams.get("eventLimit") || 100);
    const events = await listCrawlRunEvents(context.params.runId, Number.isFinite(rawLimit) ? rawLimit : 100);
    return NextResponse.json({ run, events });
  } catch (error) {
    console.error("[Admin crawl runs API] detail error:", error);
    return NextResponse.json({ error: "Unable to load crawl run" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { runId: string } },
) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const brandName = text(body.brandName, 180);
    const keywords = stringList(body.keywords, 50, 160);
    const platforms = stringList(body.platforms, 20, 80)
      .filter((platform) => SUPPORTED_PLATFORMS.has(platform));

    if (!brandName) {
      return NextResponse.json({ error: "Tên thương hiệu không được để trống." }, { status: 400 });
    }
    if (!keywords.length) {
      return NextResponse.json({ error: "Cần ít nhất một từ khóa." }, { status: 400 });
    }
    if (!platforms.length) {
      return NextResponse.json({ error: "Cần chọn ít nhất một nền tảng." }, { status: 400 });
    }

    const runReference = db.collection("crawl_runs").doc(context.params.runId) as DocumentReference<DocumentData>;
    let consultationId = "";
    await db.runTransaction(async (transaction: Transaction) => {
      const snapshot = await transaction.get(runReference);
      if (!snapshot.exists) throw new Error("NOT_FOUND");
      const run = snapshot.data() || {};
      if (run.runType !== "trial") throw new Error("NOT_TRIAL");
      if (run.status !== "queued") throw new Error("NOT_QUEUED");
      consultationId = text(run.consultationId, 120);
      transaction.set(runReference, {
        platforms,
        progressTotal: platforms.length,
        metadata: {
          ...(run.metadata || {}),
          brandName,
          company: brandName,
          keywords,
          configurationUpdatedAt: new Date().toISOString(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    });

    if (consultationId) {
      await db.collection("consultations").doc(consultationId).set({
        trialCrawlConfiguration: { brandName, keywords, platforms },
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    await appendCrawlRunEvent(context.params.runId, {
      eventType: "progress",
      phase: "queued",
      message: `Đã cập nhật cấu hình trial: ${brandName}, ${platforms.length} nền tảng, ${keywords.length} từ khóa.`,
      progressCurrent: 0,
      progressTotal: platforms.length,
    });
    return NextResponse.json({ success: true, run: await getCrawlRun(context.params.runId) });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Không tìm thấy phiên cào." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "NOT_TRIAL") {
      return NextResponse.json({ error: "Chỉ được sửa cấu hình phiên trial." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "NOT_QUEUED") {
      return NextResponse.json({ error: "Chỉ được sửa khi phiên còn trong hàng đợi." }, { status: 409 });
    }
    console.error("[Admin crawl runs API] update error:", error);
    return NextResponse.json({ error: "Không thể cập nhật cấu hình trial." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { runId: string } },
) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const runReference = db.collection("crawl_runs").doc(context.params.runId) as DocumentReference<DocumentData>;
    let consultationId = "";
    await db.runTransaction(async (transaction: Transaction) => {
      const snapshot = await transaction.get(runReference);
      if (!snapshot.exists) throw new Error("NOT_FOUND");
      const run = snapshot.data() || {};
      if (run.status !== "queued") throw new Error("NOT_QUEUED");
      consultationId = text(run.consultationId, 120);
      transaction.set(runReference, {
        status: "cancelled",
        currentPhase: "cancelled",
        finishedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    });

    await appendCrawlRunEvent(context.params.runId, {
      level: "warn",
      eventType: "cancelled",
      phase: "cancelled",
      message: "Admin đã xóa phiên trial khỏi hàng đợi.",
      update: {
        status: "cancelled",
        currentPhase: "cancelled",
        finishedAt: true,
      },
    });
    if (consultationId) {
      await db.collection("consultations").doc(consultationId).set({
        trialCrawlStatus: "cancelled",
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    return NextResponse.json({ success: true, run: await getCrawlRun(context.params.runId) });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Không tìm thấy phiên cào." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "NOT_QUEUED") {
      return NextResponse.json({ error: "Chỉ được xóa phiên chưa được worker nhận." }, { status: 409 });
    }
    console.error("[Admin crawl runs API] cancel error:", error);
    return NextResponse.json({ error: "Không thể xóa phiên khỏi hàng đợi." }, { status: 500 });
  }
}

