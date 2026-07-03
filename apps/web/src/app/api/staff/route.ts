import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getAuthorization(request: NextRequest) {
  return request.headers.get("authorization");
}

export async function GET(request: NextRequest) {
  try {
    const authorization = getAuthorization(request);
    if (!authorization) {
      return NextResponse.json({ error: "Ban can dang nhap bang tai khoan Quan ly thuong hieu." }, { status: 401 });
    }

    const response = await fetch(`${API_BASE_URL}/api/staff`, {
      method: "GET",
      headers: { Authorization: authorization },
    });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Khong the tai danh sach nhan vien." }, { status: response.status });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("[API Proxy] load staff error:", error);
    return NextResponse.json({ error: "Loi may chu. Vui long thu lai sau." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorization = getAuthorization(request);
    if (!authorization) {
      return NextResponse.json({ error: "Ban can dang nhap bang tai khoan Quan ly thuong hieu." }, { status: 401 });
    }

    const body = await request.json();
    const response = await fetch(`${API_BASE_URL}/api/staff`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Khong the tao tai khoan nhan vien." }, { status: response.status });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("[API Proxy] create staff error:", error);
    return NextResponse.json({ error: "Loi may chu. Vui long thu lai sau." }, { status: 500 });
  }
}

