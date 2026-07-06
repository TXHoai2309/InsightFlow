import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/server/auth";
import { revealTemporaryPassword, StaffServiceError } from "@/lib/server/staffService";

export async function POST(request: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const user = await verifyBearerToken(request.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Bạn cần đăng nhập bằng tài khoản Quản lý thương hiệu." }, { status: 401 });
    }

    const data = await revealTemporaryPassword(user, params.uid);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error instanceof StaffServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[Staff API] reveal password error:", error);
    return NextResponse.json({ error: "Không thể xem mật khẩu tạm thời." }, { status: 500 });
  }
}
