import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyBearerToken } from "@/lib/server/auth";

type OnboardingRole = "brand_manager" | "crisis_employee" | "lead_employee";

function normalizeRouteKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const routeKey = value.trim();
  if (!routeKey.startsWith("/") || routeKey.length > 120) return null;
  return routeKey;
}

function routeStorageKey(routeKey: string, version: number): string {
  return `${routeKey.replace(/^\//, "").replace(/[^a-zA-Z0-9_-]/g, "_") || "home"}_v${version}`;
}

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

    const body = (await request.json()) as {
      role?: unknown;
      version?: unknown;
      routeKey?: unknown;
      state?: Record<string, unknown>;
    };
    const routeKey = normalizeRouteKey(body.routeKey);
    const routeVersion =
      typeof body.version === "number" && Number.isInteger(body.version)
        ? body.version
        : null;

    if (routeKey && routeVersion && routeVersion > 0 && routeVersion < 1000) {
      const state = body.state || {};
      const normalizedState = {
        completed: state.completed === true,
        skipped: state.skipped === true,
        currentStepIndex:
          typeof state.currentStepIndex === "number" &&
          Number.isInteger(state.currentStepIndex)
            ? Math.max(0, Math.min(state.currentStepIndex, 100))
            : 0,
        completedAt:
          typeof state.completedAt === "string" ? state.completedAt : null,
        skippedAt: typeof state.skippedAt === "string" ? state.skippedAt : null,
        updatedAt: new Date().toISOString(),
      };
      const storageKey = routeStorageKey(routeKey, routeVersion);
      await adminDb.collection("users").doc(user.uid).update({
        [`onboarding.routeTours.${storageKey}`]: normalizedState,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ success: true, data: normalizedState });
    }

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

export async function GET(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
    }

    const routeKey = normalizeRouteKey(request.nextUrl.searchParams.get("routeKey"));
    const version = Number(request.nextUrl.searchParams.get("version"));
    if (!routeKey || !Number.isInteger(version) || version <= 0 || version >= 1000) {
      return NextResponse.json({ error: "Route onboarding không hợp lệ." }, { status: 400 });
    }

    const snapshot = await adminDb.collection("users").doc(user.uid).get();
    const storageKey = routeStorageKey(routeKey, version);
    const state = snapshot.data()?.onboarding?.routeTours?.[storageKey] || null;
    return NextResponse.json({ success: true, data: state });
  } catch (error) {
    console.error("[Onboarding API] read error:", error);
    return NextResponse.json(
      { error: "Chưa thể đọc trạng thái hướng dẫn." },
      { status: 500 },
    );
  }
}
