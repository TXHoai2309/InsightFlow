import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getApiBaseUrl } from "@/lib/apiProxy";
import { verifyBearerToken } from "@/lib/server/auth";
import { db } from "@/lib/server/firebaseAdmin";

async function requireAdmin(request: NextRequest) {
  const token = await verifyBearerToken(request.headers.get("authorization"));
  if (!token) return null;
  const profile = await db.collection("users").doc(token.uid).get();
  return (profile.data()?.role || token.role) === "admin" ? token : null;
}

function serializeValue(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, serializeValue(item)]),
    );
  }
  return value;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: "Bạn không có quyền xem danh sách Brand Manager." }, { status: 403 });
    }

    const snapshot = await db.collection("users").where("role", "==", "brand_manager").get();
    const brandManagers = snapshot.docs
      .map((document: any) => {
        const data = document.data();
        return {
          uid: document.id,
          email: String(data.email || ""),
          displayName: String(data.displayName || ""),
          role: "brand_manager",
          brandId: String(data.brandId || ""),
          brandName: String(data.brandName || ""),
          companyDomain: String(data.companyDomain || ""),
          permissions: Array.isArray(data.permissions) ? data.permissions : [],
          defaultRoute: String(data.defaultRoute || "/dashboard"),
          disabled: data.disabled === true,
          hasTemporaryPassword: data.temporaryPasswordIssued === true && Boolean(data.temporaryPassword),
          createdAt: serializeValue(data.createdAt),
          updatedAt: serializeValue(data.updatedAt),
        };
      })
      .sort((a: any, b: any) => a.displayName.localeCompare(b.displayName, "vi"));

    return NextResponse.json({ success: true, data: brandManagers });
  } catch (error: any) {
    console.error("[Admin brand managers API] load error:", error);
    return NextResponse.json(
      { error: "Chưa thể tải danh sách Brand Manager." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    const body = await request.json();

    if (!authorization) {
      return NextResponse.json({ error: "Ban can dang nhap bang tai khoan Admin." }, { status: 401 });
    }

    const response = await fetch(`${getApiBaseUrl(request)}/api/admin/brand-managers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Không thể tạo tài khoản Brand Manager." },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("[API Proxy] create brand manager error:", error);
    return NextResponse.json(
      { error: "Loi may chu. Vui long thu lai sau." },
      { status: 500 },
    );
  }
}
