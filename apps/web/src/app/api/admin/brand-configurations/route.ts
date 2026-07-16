import { NextRequest, NextResponse } from "next/server";

function mergedResponse(request: NextRequest) {
  return NextResponse.json(
    {
      error: "Cấu hình thương hiệu đã được gộp vào Yêu cầu tư vấn.",
      redirectTo: new URL("/admin/consultations", request.url).pathname,
    },
    { status: 410 },
  );
}

export async function GET(request: NextRequest) {
  return mergedResponse(request);
}

export async function PATCH(request: NextRequest) {
  return mergedResponse(request);
}
