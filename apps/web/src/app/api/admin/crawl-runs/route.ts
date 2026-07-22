import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/server/auth";
import { db } from "@/lib/server/firebaseAdmin";
import {
  appendCrawlRunEvent,
  createCrawlRun,
  getCrawlRun,
  listCrawlRuns,
} from "@/lib/server/crawlRuns";

const ACTIVE_STATUSES = new Set([
  "queued",
  "waiting_resource",
  "running",
  "labeling",
  "syncing",
]);

const PLATFORM_ALIASES: Record<string, string> = {
  facebook: "facebook",
  tiktok: "tiktok",
  youtube: "youtube",
  review: "google_maps",
  reviews: "google_maps",
  "google maps": "google_maps",
  google_maps: "google_maps",
  "tin tức": "news_html",
  news: "news_html",
  news_html: "news_html",
  website: "website",
  threads: "threads",
};

const TRIAL_SUPPORTED_PLATFORMS = new Set([
  "facebook",
  "threads",
  "tiktok",
  "youtube",
  "google_maps",
  "news_html",
]);

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizePlatforms(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .map((item) => text(item, 80).toLowerCase())
    .map((item) => PLATFORM_ALIASES[item])
    .filter((item): item is string => Boolean(item) && TRIAL_SUPPORTED_PLATFORMS.has(item)))];
}

async function requireAdmin(request: NextRequest) {
  const token = await verifyBearerToken(request.headers.get("authorization"));
  if (!token) return null;
  const profile = await db.collection("users").doc(token.uid).get();
  return (profile.data()?.role || token.role) === "admin" ? token : null;
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const rawLimit = Number(request.nextUrl.searchParams.get("limit") || 20);
    return NextResponse.json({ runs: await listCrawlRuns(Number.isFinite(rawLimit) ? rawLimit : 20) });
  } catch (error) {
    console.error("[Admin crawl runs API] list error:", error);
    return NextResponse.json({ error: "Unable to load crawl runs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Bạn không có quyền tạo phiên cào." }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const consultationId = text(body.consultationId, 120);
    if (!consultationId) {
      return NextResponse.json({ error: "Thiếu mã yêu cầu dùng thử." }, { status: 400 });
    }

    const consultationReference = db.collection("consultations").doc(consultationId);
    const consultationSnapshot = await consultationReference.get();
    if (!consultationSnapshot.exists) {
      return NextResponse.json({ error: "Không tìm thấy yêu cầu dùng thử." }, { status: 404 });
    }

    const consultation = consultationSnapshot.data() || {};
    if (text(consultation.status, 40) !== "completed") {
      return NextResponse.json({ error: "Yêu cầu cần được duyệt trước khi tạo phiên cào trial." }, { status: 409 });
    }
    const existingRunId = text(consultation.trialCrawlRunId, 120);
    if (existingRunId) {
      const existingRun = await getCrawlRun(existingRunId);
      if (existingRun && ACTIVE_STATUSES.has(existingRun.status)) {
        return NextResponse.json(
          { error: "Yêu cầu này đang có một phiên cào hoạt động.", run: existingRun },
          { status: 409 },
        );
      }
    }

    const savedConfiguration = consultation.trialCrawlConfiguration
      && typeof consultation.trialCrawlConfiguration === "object"
      ? consultation.trialCrawlConfiguration as Record<string, unknown>
      : {};
    const requestedChannels = Array.isArray(consultation.platforms)
      ? consultation.platforms.map((item: unknown) => text(item, 80)).filter(Boolean)
      : [];
    const savedPlatforms = Array.isArray(savedConfiguration.platforms)
      ? savedConfiguration.platforms.map((item: unknown) => text(item, 80)).filter(Boolean)
      : [];
    const platforms = normalizePlatforms(savedPlatforms.length ? savedPlatforms : requestedChannels);
    if (platforms.length === 0) {
      return NextResponse.json(
        { error: "Yêu cầu chưa có kênh cào được hỗ trợ." },
        { status: 400 },
      );
    }

    const keywordSource = Array.isArray(savedConfiguration.keywords)
      ? savedConfiguration.keywords
      : consultation.keywords;
    const keywords = Array.isArray(keywordSource)
      ? keywordSource.map((item: unknown) => text(item, 160)).filter(Boolean).slice(0, 50)
      : [];
    const company = text(savedConfiguration.brandName, 180) || text(consultation.company, 180);
    if (!company) {
      return NextResponse.json(
        { error: "Yêu cầu chưa có tên thương hiệu." },
        { status: 400 },
      );
    }
    if (keywords.length === 0) {
      return NextResponse.json(
        { error: "Yêu cầu chưa có từ khóa để cào." },
        { status: 400 },
      );
    }
    const runId = await createCrawlRun({
      runType: "trial",
      consultationId,
      platforms,
      requestedBy: admin.uid,
      metadata: {
        company,
        brandName: company,
        keywords,
        requestedChannels,
        configurationNotes: text(consultation.configurationNotes, 2000),
        requestSource: text(consultation.requestSource, 120) || "trial-registration",
      },
    });

    await appendCrawlRunEvent(runId, {
      eventType: "progress",
      message: `Đã xếp hàng phiên cào trial cho ${company || consultationId}.`,
      progressCurrent: 0,
      progressTotal: platforms.length,
      update: {
        status: "queued",
        progressCurrent: 0,
        progressTotal: platforms.length,
        currentPhase: "queued",
      },
    });

    await consultationReference.set({
      trialCrawlRunId: runId,
      trialCrawlStatus: "queued",
      trialCrawlRequestedAt: new Date(),
      trialCrawlRequestedBy: admin.uid,
      updatedAt: new Date(),
    }, { merge: true });

    return NextResponse.json({ success: true, runId, status: "queued" }, { status: 201 });
  } catch (error) {
    console.error("[Admin crawl runs API] create trial error:", error);
    return NextResponse.json({ error: "Chưa thể tạo phiên cào trial." }, { status: 500 });
  }
}
