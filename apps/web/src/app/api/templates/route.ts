// apps/web/src/app/api/templates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/apiProxy";

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization) {
      return NextResponse.json({ error: "Bạn cần đăng nhập để thực hiện tác vụ này." }, { status: 401 });
    }

    const response = await fetch(`${getApiBaseUrl(request)}/api/templates`, {
      method: "GET",
      headers: { Authorization: authorization },
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Không thể tải danh sách mẫu phản hồi." },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("[API Proxy] load templates error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    const body = await request.json();

    if (!authorization) {
      return NextResponse.json({ error: "Bạn cần đăng nhập để thực hiện tác vụ này." }, { status: 401 });
    }

    const response = await fetch(`${getApiBaseUrl(request)}/api/templates`, {
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
        { error: data.error || "Không thể tạo mẫu phản hồi mới." },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("[API Proxy] create template error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
