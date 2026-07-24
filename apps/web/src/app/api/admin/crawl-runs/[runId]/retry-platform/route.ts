import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/server/auth";
import { db } from "@/lib/server/firebaseAdmin";
import {
  appendCrawlRunEvent,
  createCrawlRun,
  getCrawlRun,
  listCrawlRuns,
} from "@/lib/server/crawlRuns";
import {
  getConsultation,
  updateConsultation,
} from "@/lib/server/vpsOperationalStore";

const ACTIVE_STATUSES = new Set([
  "queued",
  "waiting_resource",
  "running",
  "labeling",
  "syncing",
]);

const SUPPORTED_PLATFORMS = new Set([
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

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function requireAdmin(request: NextRequest) {
  const token = await verifyBearerToken(request.headers.get("authorization"));
  if (!token) return null;
  if (token.role === "admin") return token;
  const profile = await db.collection("users").doc(token.uid).get();
  return (profile.data()?.role || token.role) === "admin" ? token : null;
}

export async function POST(
  request: NextRequest,
  context: { params: { runId: string } },
) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Bạn không có quyền cào lại nền tảng." }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const platform = text(body.platform, 80);
    if (!SUPPORTED_PLATFORMS.has(platform)) {
      return NextResponse.json({ error: "Nền tảng chưa được hỗ trợ để cào lại." }, { status: 400 });
    }

    const sourceRun = await getCrawlRun(context.params.runId);
    if (!sourceRun) {
      return NextResponse.json({ error: "Không tìm thấy phiên cào gốc." }, { status: 404 });
    }
    if (sourceRun.runType !== "trial") {
      return NextResponse.json({ error: "Chỉ hỗ trợ cào lại từng nền tảng cho phiên trial." }, { status: 409 });
    }
    if (ACTIVE_STATUSES.has(sourceRun.status)) {
      return NextResponse.json({ error: "Phiên trial gốc vẫn đang chạy; hãy chờ kết thúc trước khi cào lại." }, { status: 409 });
    }

    const metadata = sourceRun.metadata || {};
    const brandName = text(metadata.brandName, 180)
      || text(metadata.company, 180)
      || text(body.brandName, 180);
    if (!brandName) {
      return NextResponse.json({ error: "Phiên cào gốc thiếu tên thương hiệu." }, { status: 400 });
    }

    const keywords = Array.isArray(metadata.keywords)
      ? metadata.keywords.map((item) => text(item, 160)).filter(Boolean).slice(0, 50)
      : [brandName];
    const requestedChannels = Array.isArray(metadata.requestedChannels)
      ? metadata.requestedChannels.map((item) => text(item, 80)).filter(Boolean)
      : sourceRun.platforms || [];

    const consultation = sourceRun.consultationId
      ? await getConsultation(sourceRun.consultationId)
      : null;
    const trialBrandSlug = text(metadata.trialBrandSlug, 100)
      || text(consultation?.trialBrandSlug, 100)
      || `trial-${slugify(brandName)}-${sourceRun.id.slice(0, 8).toLowerCase()}`;

    if (sourceRun.consultationId) {
      const activeRuns = await listCrawlRuns(100);
      const blockingRun = activeRuns.find((run) =>
        run.id !== sourceRun.id
        && run.runType === "trial"
        && run.consultationId === sourceRun.consultationId
        && ACTIVE_STATUSES.has(run.status)
      );
      if (blockingRun) {
        return NextResponse.json(
          { error: "Yêu cầu này đang có một phiên cào trial khác hoạt động.", run: blockingRun },
          { status: 409 },
        );
      }
    }

    const retryRunId = await createCrawlRun({
      runType: "trial",
      consultationId: sourceRun.consultationId,
      platforms: [platform],
      requestedBy: admin.uid,
      metadata: {
        ...metadata,
        company: brandName,
        brandName,
        keywords: keywords.length ? keywords : [brandName],
        requestedChannels,
        trialBrandSlug,
        retryOfRunId: sourceRun.id,
        retryPlatform: platform,
        retryRequestedAt: new Date().toISOString(),
      },
    });

    await appendCrawlRunEvent(retryRunId, {
      eventType: "progress",
      platform,
      phase: "queued",
      message: `Đã xếp hàng cào lại ${platform} cho ${brandName}.`,
      progressCurrent: 0,
      progressTotal: 1,
      update: {
        status: "queued",
        progressCurrent: 0,
        progressTotal: 1,
        currentPlatform: platform,
        currentPhase: "queued",
      },
    });

    if (sourceRun.consultationId) {
      await updateConsultation(sourceRun.consultationId, {
        trialCrawlRunId: retryRunId,
        trialCrawlStatus: "queued",
        trialCrawlRequestedAt: new Date().toISOString(),
        trialCrawlRequestedBy: admin.uid,
        trialBrandSlug,
      });
    }

    return NextResponse.json({
      success: true,
      runId: retryRunId,
      run: await getCrawlRun(retryRunId),
    }, { status: 201 });
  } catch (error) {
    console.error("[Admin crawl runs API] retry platform error:", error);
    return NextResponse.json({ error: "Chưa thể xếp hàng cào lại nền tảng." }, { status: 500 });
  }
}
