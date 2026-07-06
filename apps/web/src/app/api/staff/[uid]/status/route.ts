import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/server/auth";
import { StaffServiceError, updateStaffStatus } from "@/lib/server/staffService";

export async function PATCH(request: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const user = await verifyBearerToken(request.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Bạn cần đăng nhập bằng tài khoản Quản lý thương hiệu." }, { status: 401 });
    }

    const body = await request.json();
    if (typeof body.disabled !== "boolean") {
      return NextResponse.json({ error: "Trạng thái không hợp lệ." }, { status: 400 });
    }

    const data = await updateStaffStatus(user, params.uid, body.disabled);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error instanceof StaffServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[Staff API] status error:", error);
    return NextResponse.json({ error: "Không thể cập nhật trạng thái tài khoản." }, { status: 500 });
  }
}
