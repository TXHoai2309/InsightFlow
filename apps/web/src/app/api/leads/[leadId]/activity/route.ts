import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl, readApiResponse } from "@/lib/apiProxy";

export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } },
) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json(
      { success: false, code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  try {
    const target = new URL(
      `${getApiBaseUrl(request)}/api/leads/${encodeURIComponent(params.leadId)}/activity`,
    );
    ["cursor", "limit"].forEach((key) => {
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
    console.error("[Lead activity proxy] load error", error);
    return NextResponse.json(
      { success: false, code: "TEMPORARY_ERROR" },
      { status: 500 },
    );
  }
}

