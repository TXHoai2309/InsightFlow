import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/server/auth";
import { db } from "@/lib/server/firebaseAdmin";
import {
  getProductionCrawlControl,
  setProductionCrawlControl,
} from "@/lib/server/crawlRuns";

async function requireAdmin(request: NextRequest) {
  const token = await verifyBearerToken(request.headers.get("authorization"));
  if (!token) return null;
  if (token.role === "admin") return token;
  const profile = await db.collection("users").doc(token.uid).get();
  return (profile.data()?.role || token.role) === "admin" ? token : null;
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    return NextResponse.json({ production: await getProductionCrawlControl() });
  } catch (error) {
    console.error("[Admin crawl control API] get error:", error);
    return NextResponse.json({ error: "Không tải được trạng thái điều khiển crawler." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Bạn không có quyền điều khiển crawler." }, { status: 403 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const paused = body.paused === true;
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 300) : undefined;
    const production = await setProductionCrawlControl({
      paused,
      reason,
      updatedBy: admin.uid,
    });
    return NextResponse.json({ success: true, production });
  } catch (error) {
    console.error("[Admin crawl control API] set error:", error);
    return NextResponse.json({ error: "Không cập nhật được trạng thái điều khiển crawler." }, { status: 500 });
  }
}
