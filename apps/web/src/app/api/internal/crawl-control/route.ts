import { NextRequest, NextResponse } from "next/server";
import { hasCrawlRunIngestAccess } from "@/lib/server/crawlRunIngestAuth";
import { getProductionCrawlControl } from "@/lib/server/crawlRuns";

export async function GET(request: NextRequest) {
  if (!hasCrawlRunIngestAccess(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scope = request.nextUrl.searchParams.get("scope") || "production";
  if (scope !== "production") {
    return NextResponse.json({ error: "Unsupported control scope" }, { status: 400 });
  }

  try {
    return NextResponse.json({ production: await getProductionCrawlControl() });
  } catch (error) {
    console.error("[Internal crawl control API] get error:", error);
    return NextResponse.json({ error: "Unable to load crawl control" }, { status: 500 });
  }
}
