import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

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
        { error: "Vui long xac thuc lai truoc khi xem mat khau." },
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

    if (managerProfile.temporaryPasswordIssued !== true || !managerProfile.temporaryPassword) {
      return NextResponse.json(
        { error: "Temporary password is no longer available for this account." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        uid: params.uid,
        temporaryPassword: managerProfile.temporaryPassword,
      },
    });
  } catch (error: any) {
    console.error("[API Proxy] reveal temporary password error:", error);
    return NextResponse.json(
      { error: error.message || "Khong the hien thi mat khau tam thoi." },
      { status: 500 },
    );
  }
}
