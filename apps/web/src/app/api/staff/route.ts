import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/server/auth";
import { createStaff, listStaff, StaffServiceError } from "@/lib/server/staffService";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Bạn cần đăng nhập bằng tài khoản Quản lý thương hiệu." }, { status: 401 });
    }

    const data = await listStaff(user);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error instanceof StaffServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[Staff API] load error:", error);
    return NextResponse.json({ error: "Không thể tải danh sách nhân viên. Vui lòng thử lại sau." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Bạn cần đăng nhập bằng tài khoản Quản lý thương hiệu." }, { status: 401 });
    }

    const body = await request.json();
    const result = await createStaff(user, body);
    return NextResponse.json({ success: true, ...result }, { status: result.created ? 201 : 200 });
  } catch (error: any) {
    if (error instanceof StaffServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[Staff API] create error:", error);
    return NextResponse.json({ error: "Không thể tạo tài khoản nhân viên. Vui lòng thử lại sau." }, { status: 500 });
  }
}
