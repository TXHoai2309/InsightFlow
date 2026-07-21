import { NextResponse } from "next/server";

function retiredResponse() {
  return NextResponse.json(
    { error: "Presence đã chuyển sang đồng bộ Firestore realtime phía client." },
    { status: 410 },
  );
}

export const GET = retiredResponse;
export const POST = retiredResponse;
export const DELETE = retiredResponse;
