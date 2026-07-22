import crypto from "crypto";
import { NextRequest } from "next/server";

export function hasCrawlRunIngestAccess(request: NextRequest) {
  const expected = process.env.CRAWL_RUNS_INGEST_TOKEN?.trim();
  if (!expected) return false;

  const supplied =
    request.headers.get("x-crawl-runs-token")?.trim() ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    "";
  if (!supplied) return false;

  const expectedBuffer = Buffer.from(expected, "utf8");
  const suppliedBuffer = Buffer.from(supplied, "utf8");
  return (
    expectedBuffer.length === suppliedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)
  );
}

