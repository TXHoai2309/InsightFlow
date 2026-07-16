import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyBearerToken } from "@/lib/server/auth";

type OnboardingRole = "brand_manager" | "crisis_employee" | "lead_employee";

function normalizeOnboardingRole(value: unknown): OnboardingRole | null {
  if (value === "brand_manager") return value;
  if (value === "crisis_employee" || value === "crisis_staff") return "crisis_employee";
  if (value === "lead_employee" || value === "lead_staff") return "lead_employee";
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Bạn cần đăng nhập để lưu trạng thái hướng dẫn." }, { status: 401 });
    }

    const body = (await request.json()) as { role?: unknown; version?: unknown };
    const requestedRole = normalizeOnboardingRole(body.role);
    const version = typeof body.version === "string" ? body.version.trim() : "";

    if (!requestedRole || !version || version.length > 100) {
      return NextResponse.json({ error: "Trạng thái hướng dẫn không hợp lệ." }, { status: 400 });
    }

    const userRef = adminDb.collection("users").doc(user.uid);
    const snapshot = await userRef.get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ người dùng." }, { status: 404 });
    }

    const profile = snapshot.data() || {};
    const actualRole = normalizeOnboardingRole(profile.role ?? user.role);
    if (actualRole !== requestedRole) {
      return NextResponse.json({ error: "Bạn không thể cập nhật hướng dẫn của vai trò khác." }, { status: 403 });
    }

    const completedAt = new Date().toISOString();
    const state = {
      completedAt,
      lastSeenAt: completedAt,
      version,
    };

    await userRef.set(
      {
        onboarding: {
          [requestedRole]: {
            completedAt,
            lastSeenAt: FieldValue.serverTimestamp(),
            version,
          },
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const userRecord = await adminAuth.getUser(user.uid);
    const existingOnboarding =
      userRecord.customClaims?.onboarding &&
      typeof userRecord.customClaims.onboarding === "object" &&
      !Array.isArray(userRecord.customClaims.onboarding)
        ? userRecord.customClaims.onboarding
        : {};

    await adminAuth.setCustomUserClaims(user.uid, {
      ...(userRecord.customClaims || {}),
      onboarding: {
        ...existingOnboarding,
        [requestedRole]: state,
      },
    });

    return NextResponse.json({ success: true, data: { role: requestedRole, state } });
  } catch (error) {
    console.error("[Onboarding API] complete error:", error);
    return NextResponse.json(
      { error: "Chưa thể lưu trạng thái hướng dẫn. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}
