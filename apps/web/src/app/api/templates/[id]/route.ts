// apps/web/src/app/api/templates/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/apiProxy";

type RouteParams = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const authorization = request.headers.get("authorization");
    const body = await request.json();

    if (!authorization) {
      return NextResponse.json({ error: "Bạn cần đăng nhập để thực hiện tác vụ này." }, { status: 401 });
    }

    const response = await fetch(`${getApiBaseUrl(request)}/api/templates/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Không thể cập nhật mẫu phản hồi." },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("[API Proxy] update template error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const authorization = request.headers.get("authorization");

    if (!authorization) {
      return NextResponse.json({ error: "Bạn cần đăng nhập để thực hiện tác vụ này." }, { status: 401 });
    }

    const response = await fetch(`${getApiBaseUrl(request)}/api/templates/${id}`, {
      method: "DELETE",
      headers: { Authorization: authorization },
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Không thể xóa mẫu phản hồi." },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("[API Proxy] delete template error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
