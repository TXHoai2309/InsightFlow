// apps/web/src/app/api/templates/generate-reply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/apiProxy";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    const body = await request.json();

    if (!authorization) {
      return NextResponse.json({ error: "Bạn cần đăng nhập để thực hiện tác vụ này." }, { status: 401 });
    }

    const response = await fetch(`${getApiBaseUrl(request)}/api/templates/generate-reply`, {
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
        { error: data.error || "Không thể sinh câu phản hồi bằng AI." },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("[API Proxy] generate reply error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
