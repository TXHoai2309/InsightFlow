import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/server/auth";
import { StaffServiceError, updateStaff } from "@/lib/server/staffService";

export async function PATCH(request: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const user = await verifyBearerToken(request.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Bạn cần đăng nhập bằng tài khoản Quản lý thương hiệu." }, { status: 401 });
    }

    const body = await request.json();
    const data = await updateStaff(user, params.uid, body);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error instanceof StaffServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[Staff API] update error:", error);
    return NextResponse.json({ error: "Không thể cập nhật tài khoản nhân viên." }, { status: 500 });
  }
}
