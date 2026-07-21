import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/server/auth";
import { db } from "@/lib/server/firebaseAdmin";
import { getCrawlRun, listCrawlRunEvents } from "@/lib/server/crawlRuns";

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

