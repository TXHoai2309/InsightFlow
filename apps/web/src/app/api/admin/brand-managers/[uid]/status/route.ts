import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl, readApiResponse } from "@/lib/apiProxy";

export async function PATCH(request: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization) {
      return NextResponse.json({ error: "Ban can dang nhap bang tai khoan Admin." }, { status: 401 });
    }

    const body = await request.json();
    const response = await fetch(`${getApiBaseUrl(request)}/api/admin/brand-managers/${params.uid}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify(body),
    });
    const data = await readApiResponse(response);

    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Khong the cap nhat trang thai tai khoan." }, { status: response.status });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("[API Proxy] update brand manager status error:", error);
    return NextResponse.json({ error: "Loi may chu. Vui long thu lai sau." }, { status: 500 });
  }
}
