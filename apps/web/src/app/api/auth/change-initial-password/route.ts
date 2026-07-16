import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/server/auth";
import {
  changeInitialPassword,
  InitialPasswordServiceError,
} from "@/lib/server/initialPasswordService";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("authorization"));
    if (!user) {
      return NextResponse.json(
        { code: "INVALID_SESSION", error: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
    if (!newPassword) {
      return NextResponse.json(
        { code: "MISSING_PASSWORD", error: "Mật khẩu mới là bắt buộc." },
        { status: 400 },
      );
    }

    const result = await changeInitialPassword(user, newPassword);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof InitialPasswordServiceError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status },
      );
    }

    console.error("[InitialPassword API] Unexpected error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", error: "Không thể đổi mật khẩu lúc này. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}
