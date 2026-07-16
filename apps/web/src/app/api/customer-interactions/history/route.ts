import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl, readApiResponse } from "@/lib/apiProxy";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json(
      {
        success: false,
        code: "AUTH_REQUIRED",
        error: "Bạn cần đăng nhập để xem lịch sử tương tác.",
      },
      { status: 401 },
    );
  }

  try {
    const target = new URL(`${getApiBaseUrl(request)}/api/customer-interactions/history`);
    ["sourceType", "sourceId", "cursor", "limit"].forEach((key) => {
      const value = request.nextUrl.searchParams.get(key);
      if (value) target.searchParams.set(key, value);
    });

    const response = await fetch(target, {
      headers: { Authorization: authorization },
      cache: "no-store",
    });
    const data = await readApiResponse(response);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[Customer interaction proxy] load error", error);
    return NextResponse.json(
      {
        success: false,
        code: "TEMPORARY_ERROR",
        error: "Chưa thể tải lịch sử tương tác. Vui lòng thử lại.",
      },
      { status: 500 },
    );
  }
}
