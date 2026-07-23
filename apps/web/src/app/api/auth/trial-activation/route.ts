import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/server/auth";
import { db } from "@/lib/server/firebaseAdmin";
import { getConsultation, updateConsultation } from "@/lib/server/vpsOperationalStore";

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: NextRequest) {
  const user = await verifyBearerToken(request.headers.get("authorization"));
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const profile = (await db.collection("users").doc(user.uid).get()).data() || {};
    const consultationIds = Array.from(new Set([
      ...(Array.isArray(profile.trialConsultationIds) ? profile.trialConsultationIds : []),
      text(profile.createdFromConsultationId, 120),
    ].map((value) => text(value, 120)).filter(Boolean)));

    if (consultationIds.length === 0) {
      return NextResponse.json({ success: true, updated: 0 });
    }

    const activatedAt = new Date().toISOString();
    const results = await Promise.all(consultationIds.map(async (consultationId) => {
      const consultation = await getConsultation(consultationId);
      if (!consultation) return false;
      if (consultation.accountStatus === "activated" || consultation.customerActivatedAt) {
        return false;
      }
      await updateConsultation(consultationId, {
        accountStatus: "activated",
        customerActivatedAt: activatedAt,
      });
      return true;
    }));
    return NextResponse.json({
      success: true,
      updated: results.filter(Boolean).length,
      activatedAt,
    });
  } catch (error) {
    console.error("[Trial activation API] update error:", error);
    return NextResponse.json({ error: "Không thể ghi nhận trạng thái kích hoạt." }, { status: 500 });
  }
}
