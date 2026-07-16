import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/server/firebaseAdmin";

const ALLOWED_PLATFORMS = new Set([
  "Facebook",
  "TikTok",
  "YouTube",
  "Threads",
  "Tin tức/Báo chí",
  "Website/Blog",
  "Google Maps",
  "Sàn thương mại điện tử",
]);

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fullName = text(body.fullName, 120);
    const email = text(body.email, 180).toLowerCase();
    const phone = text(body.phone, 40);
    const company = text(body.company, 180);
    const industry = text(body.industry, 120);
    const need = text(body.need, 180);
    const teamSize = text(body.teamSize, 40);
    const configurationNotes = text(body.configurationNotes, 2000);
    const keywords = Array.isArray(body.keywords)
      ? [...new Set(body.keywords.map((item: unknown) => text(item, 120)).filter(Boolean))].slice(0, 40)
      : [];
    const platforms = Array.isArray(body.platforms)
      ? [...new Set(body.platforms.filter((item: unknown): item is string => typeof item === "string" && ALLOWED_PLATFORMS.has(item)))].slice(0, 12)
      : [];

    if (!fullName || !email || !phone || !company || !industry || !need) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ thông tin bắt buộc." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email không đúng định dạng." }, { status: 400 });
    }
    if (keywords.length === 0 || platforms.length === 0) {
      return NextResponse.json({ error: "Vui lòng nhập từ khóa và chọn ít nhất một nền tảng theo dõi." }, { status: 400 });
    }

    const consultationRef = db.collection("consultations").doc();
    const configurationRef = db.collection("brand_configurations").doc(consultationRef.id);
    const now = FieldValue.serverTimestamp();
    const batch = db.batch();

    batch.set(consultationRef, {
      fullName,
      email,
      phone,
      company,
      industry,
      need,
      teamSize,
      status: "pending",
      notes: "",
      contactPlan: "",
      hasBrandConfiguration: true,
      configurationId: configurationRef.id,
      createdAt: now,
      updatedAt: now,
    });

    batch.set(configurationRef, {
      consultationId: consultationRef.id,
      company,
      industry,
      contactName: fullName,
      contactEmail: email,
      contactPhone: phone,
      keywords,
      platforms,
      notes: configurationNotes,
      status: "pending",
      adminNotes: "",
      createdAt: now,
      updatedAt: now,
    });

    await batch.commit();

    return NextResponse.json(
      { success: true, consultationId: consultationRef.id, configurationId: configurationRef.id },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Consultations API] submit error:", error);
    return NextResponse.json({ error: "Chưa thể gửi yêu cầu. Vui lòng thử lại sau." }, { status: 500 });
  }
}
