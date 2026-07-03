import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    const body = await request.json();

    if (!authorization) {
      return NextResponse.json({ error: "Ban can dang nhap bang tai khoan Admin." }, { status: 401 });
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/brand-managers`, {
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
        { error: data.error || "Khong the tao tai khoan Brand Manager." },
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

