import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization) {
      return NextResponse.json({ error: "Ban can dang nhap de hoan tat doi mat khau." }, { status: 401 });
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/complete-first-password-change`, {
      method: "POST",
      headers: { Authorization: authorization },
    });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Khong the hoan tat doi mat khau." }, { status: response.status });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("[API Proxy] complete first password change error:", error);
    return NextResponse.json({ error: "Loi may chu. Vui long thu lai sau." }, { status: 500 });
  }
}
