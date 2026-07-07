import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

const brandManagerPermissions = ["dashboard", "mentions", "alerts", "leads", "reports", "brand_settings", "staff_management"];

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const randomPart = Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `IF@${randomPart}24`;
}

function isAuthUserNotFound(error: any) {
  return (
    error?.code === "auth/user-not-found" ||
    error?.errorInfo?.code === "auth/user-not-found" ||
    String(error?.message || "").includes("auth/user-not-found")
  );
}

export async function POST(request: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization) {
      return NextResponse.json({ error: "Ban can dang nhap bang tai khoan Admin." }, { status: 401 });
    }

    const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    if (!token) {
      return NextResponse.json({ error: "Token dang nhap khong hop le." }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const authTime = decoded.auth_time;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (!authTime || nowInSeconds - authTime > 300) {
      return NextResponse.json(
        { error: "Vui long xac thuc lai truoc khi cap lai mat khau." },
        { status: 403 },
      );
    }

    const requesterDoc = await adminDb.collection("users").doc(decoded.uid).get();
    if (requesterDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Admin permission is required." }, { status: 403 });
    }

    const managerDoc = await adminDb.collection("users").doc(params.uid).get();
    const managerProfile = managerDoc.exists ? managerDoc.data() : null;
    if (!managerProfile || managerProfile.role !== "brand_manager") {
      return NextResponse.json({ error: "Brand Manager account not found." }, { status: 404 });
    }

    if (!managerProfile.email) {
      return NextResponse.json(
        { error: "Brand Manager account is missing an email and cannot be restored." },
        { status: 400 },
      );
    }

    const temporaryPassword = generateTemporaryPassword();
    let userRecord;

    try {
      userRecord = await adminAuth.updateUser(params.uid, {
        password: temporaryPassword,
        disabled: false,
      });
    } catch (error: any) {
      if (!isAuthUserNotFound(error)) throw error;
      userRecord = await adminAuth.createUser({
        uid: params.uid,
        email: managerProfile.email,
        password: temporaryPassword,
        displayName: managerProfile.displayName || undefined,
        emailVerified: true,
        disabled: false,
      });
    }

    await adminAuth.setCustomUserClaims(params.uid, {
      ...(userRecord.customClaims || {}),
      role: "brand_manager",
      brandId: managerProfile.brandId,
      brandName: managerProfile.brandName,
      permissions: Array.isArray(managerProfile.permissions) ? managerProfile.permissions : brandManagerPermissions,
      defaultRoute: managerProfile.defaultRoute || "/dashboard",
      temporaryPasswordIssued: true,
    });

    await adminDb.collection("users").doc(params.uid).set(
      {
        temporaryPassword,
        temporaryPasswordIssued: true,
        disabled: false,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({
      success: true,
      data: {
        uid: params.uid,
        temporaryPassword,
      },
    });
  } catch (error: any) {
    console.error("[API Proxy] reset temporary password error:", error);
    return NextResponse.json(
      { error: error.message || "Khong the cap lai mat khau tam thoi." },
      { status: 500 },
    );
  }
}
