import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/server/auth";
import { db } from "@/lib/server/firebaseAdmin";

function timestampToDate(value: unknown) {
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value && typeof value === "object" && "toDate" in value) {
    const toDate = (value as { toDate?: unknown }).toDate;
    if (typeof toDate === "function") {
      const parsed = toDate.call(value);
      return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const user = await verifyBearerToken(
    request.headers.get("authorization"),
    { allowExpiredTrial: true },
  );
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snapshot = await db.collection("users").doc(user.uid).get();
  const profile = snapshot.data() || {};
  if (profile.disabled === true) {
    return NextResponse.json(
      { error: "Tài khoản đã bị vô hiệu hóa.", code: "account_disabled" },
      { status: 403 },
    );
  }

  if (profile.trialAccount !== true) {
    return NextResponse.json(
      { active: true, isTrialAccount: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const trialEndsAt = timestampToDate(profile.trialEndsAt);
  if (!trialEndsAt) {
    return NextResponse.json(
      {
        error: "Tài khoản dùng thử chưa được cấu hình thời hạn hợp lệ.",
        code: "trial_expiry_missing",
      },
      { status: 403 },
    );
  }

  const now = Date.now();
  const remainingMs = trialEndsAt.getTime() - now;
  if (remainingMs <= 0) {
    return NextResponse.json(
      {
        error: "Thời gian dùng thử đã kết thúc. Vui lòng liên hệ InsightFlow để tiếp tục sử dụng.",
        code: "trial_expired",
        trialEndsAt: trialEndsAt.toISOString(),
        remainingMs: 0,
      },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      active: true,
      isTrialAccount: true,
      trialDays: Number(profile.trialDays) || null,
      trialEndsAt: trialEndsAt.toISOString(),
      remainingMs,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
