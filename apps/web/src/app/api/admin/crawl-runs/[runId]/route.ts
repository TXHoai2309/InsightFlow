import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/server/auth";
import { db } from "@/lib/server/firebaseAdmin";
import {
  appendCrawlRunEvent,
  getCrawlRun,
  listCrawlRunEvents,
  updateCrawlRun,
} from "@/lib/server/crawlRuns";
import {
  deleteCrawlRunRecord,
  patchQueuedCrawlRun,
  updateConsultation,
} from "@/lib/server/vpsOperationalStore";

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
  if (token.role === "admin") return true;
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
    const rawLimit = Number(request.nextUrl.searchParams.get("eventLimit") || 30);
    const events = await listCrawlRunEvents(context.params.runId, Number.isFinite(rawLimit) ? rawLimit : 30);
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

    const current = await getCrawlRun(context.params.runId);
    if (!current) return NextResponse.json({ error: "Không tìm thấy phiên cào." }, { status: 404 });
    if (current.runType !== "trial") {
      return NextResponse.json({ error: "Chỉ được sửa cấu hình phiên trial." }, { status: 409 });
    }
    if (current.status !== "queued") {
      return NextResponse.json({ error: "Chỉ được sửa khi phiên còn trong hàng đợi." }, { status: 409 });
    }

    const result = await patchQueuedCrawlRun(context.params.runId, {
      platforms,
      progressTotal: platforms.length,
      metadata: {
        ...(current.metadata || {}),
        brandName,
        company: brandName,
        keywords,
        configurationUpdatedAt: new Date().toISOString(),
      },
    });
    if (result.reason === "not_found") {
      return NextResponse.json({ error: "Không tìm thấy phiên cào." }, { status: 404 });
    }
    if (result.reason === "not_queued") {
      return NextResponse.json({ error: "Phiên vừa được worker nhận; không thể sửa cấu hình." }, { status: 409 });
    }

    if (current.consultationId) {
      await updateConsultation(current.consultationId, {
        trialCrawlConfiguration: { brandName, keywords, platforms },
      });
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
    const current = await getCrawlRun(context.params.runId);
    if (!current) return NextResponse.json({ error: "Không tìm thấy phiên cào." }, { status: 404 });

    const isCancelOnly = request.nextUrl.searchParams.get("action") === "cancel" && current.status === "queued";
    if (isCancelOnly) {
      const result = await patchQueuedCrawlRun(context.params.runId, {
        status: "cancelled",
        currentPhase: "cancelled",
        finishedAt: new Date().toISOString(),
      });
      if (result.reason) {
        return NextResponse.json({ error: "Phiên vừa được worker nhận; không thể hủy khỏi hàng đợi." }, { status: 409 });
      }

      await appendCrawlRunEvent(context.params.runId, {
        level: "warn",
        eventType: "cancelled",
        phase: "cancelled",
        message: "Admin đã hủy phiên trial khỏi hàng đợi.",
      });
      if (current.consultationId) {
        await updateConsultation(current.consultationId, { trialCrawlStatus: "cancelled" }).catch(() => {});
      }
      return NextResponse.json({ success: true, run: await getCrawlRun(context.params.runId) });
    }

    // Direct deletion from database
    await deleteCrawlRunRecord(context.params.runId);
    if (current.consultationId) {
      await updateConsultation(current.consultationId, { trialCrawlStatus: "deleted" }).catch(() => {});
    }
    return NextResponse.json({ success: true, deleted: true, id: context.params.runId });
  } catch (error) {
    console.error("[Admin crawl runs API] delete error:", error);
    return NextResponse.json({ error: "Không thể xóa phiên cào." }, { status: 500 });
  }
}
