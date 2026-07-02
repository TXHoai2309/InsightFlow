// apps/web/src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

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

    // Tìm user theo email bằng Firebase Admin SDK
    const userRecord = await adminAuth.getUserByEmail(email.trim());

    // Cập nhật mật khẩu trực tiếp
    await adminAuth.updateUser(userRecord.uid, { password: newPassword });

    return NextResponse.json(
      { message: "Mật khẩu đã được cập nhật thành công." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[reset-password] Error:", error);

    if (
      error.code === "auth/user-not-found" ||
      error.message?.includes("user-not-found")
    ) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản với email này." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Lỗi máy chủ. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
