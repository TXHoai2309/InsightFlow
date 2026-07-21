import { NextRequest, NextResponse } from "next/server";
import { hasCrawlRunIngestAccess } from "@/lib/server/crawlRunIngestAuth";
import { createCrawlRun, getCrawlRun } from "@/lib/server/crawlRuns";

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: NextRequest) {
  if (!hasCrawlRunIngestAccess(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const runType = body.runType === "trial" ? "trial" : "production";
    const platforms = Array.isArray(body.platforms)
      ? body.platforms
          .filter((value: unknown): value is string => typeof value === "string")
          .map((value: string) => value.trim().slice(0, 40))
          .filter(Boolean)
          .slice(0, 20)
      : [];

    if (!platforms.length) {
      return NextResponse.json({ error: "platforms is required" }, { status: 400 });
    }

    const run = await createCrawlRun({
      runType,
      platforms,
      workspaceId: text(body.workspaceId, 120) || undefined,
      consultationId: text(body.consultationId, 120) || undefined,
      requestedBy: text(body.requestedBy, 180) || "crawler-vps",
      metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : undefined,
    });

    const created = await getCrawlRun(run);
    return NextResponse.json({ run: created }, { status: 201 });
  } catch (error) {
    console.error("[Crawl runs API] create error:", error);
    return NextResponse.json({ error: "Unable to create crawl run" }, { status: 500 });
  }
}
