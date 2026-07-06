import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/apiProxy";

export async function POST(request: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization) {
      return NextResponse.json({ error: "Ban can dang nhap bang tai khoan Admin." }, { status: 401 });
    }

    const response = await fetch(`${getApiBaseUrl(request)}/api/admin/brand-managers/${params.uid}/temporary-password`, {
      method: "POST",
      headers: { Authorization: authorization },
    });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Khong the hien thi mat khau tam thoi." }, { status: response.status });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("[API Proxy] reveal temporary password error:", error);
    return NextResponse.json({ error: "Loi may chu. Vui long thu lai sau." }, { status: 500 });
  }
}
