import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { verifyBearerToken } from "@/lib/server/auth";
import { db } from "@/lib/server/firebaseAdmin";

const ALLOWED_STATUSES = new Set(["pending", "contacting", "completed", "unreachable"]);

async function requireAdmin(request: NextRequest) {
  const token = await verifyBearerToken(request.headers.get("authorization"));
  if (!token) return null;
  const profile = await db.collection("users").doc(token.uid).get();
  const role = profile.data()?.role || token.role;
  return role === "admin" ? token : null;
}

function serializeValue(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, serializeValue(item)]));
  }
  return value;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: "Bạn không có quyền xem yêu cầu tư vấn." }, { status: 403 });
    }

    const snapshot = await db.collection("consultations").orderBy("createdAt", "desc").limit(500).get();
    const consultations = snapshot.docs.map((document: any) => ({
      id: document.id,
      ...(serializeValue(document.data()) as Record<string, unknown>),
    }));

    return NextResponse.json({ consultations });
  } catch (error) {
    console.error("[Admin consultations API] load error:", error);
    return NextResponse.json({ error: "Chưa thể tải danh sách yêu cầu tư vấn." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: "Bạn không có quyền cập nhật yêu cầu tư vấn." }, { status: 403 });
    }

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const status = typeof body.status === "string" ? body.status.trim() : "";
    const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 3000) : "";
    const contactPlan = typeof body.contactPlan === "string" ? body.contactPlan.trim().slice(0, 1000) : "";

    if (!id || !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Dữ liệu cập nhật không hợp lệ." }, { status: 400 });
    }

    const reference = db.collection("consultations").doc(id);
    if (!(await reference.get()).exists) {
      return NextResponse.json({ error: "Không tìm thấy yêu cầu tư vấn." }, { status: 404 });
    }

    await reference.update({ status, notes, contactPlan, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin consultations API] update error:", error);
    return NextResponse.json({ error: "Chưa thể cập nhật yêu cầu tư vấn." }, { status: 500 });
  }
}
