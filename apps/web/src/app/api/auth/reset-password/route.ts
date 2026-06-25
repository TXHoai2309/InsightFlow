// apps/web/src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Email và mật khẩu mới là bắt buộc." },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Không thể cập nhật mật khẩu." },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { message: "Mật khẩu đã được cập nhật thành công." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API Proxy] reset-password error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
