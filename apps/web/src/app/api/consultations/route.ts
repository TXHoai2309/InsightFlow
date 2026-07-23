import { NextRequest, NextResponse } from "next/server";
import { sendConsultationEmail } from "@/lib/server/consultationEmail";
import {
  createConsultation,
  getConsultation,
  updateConsultation,
} from "@/lib/server/vpsOperationalStore";

const PLATFORM_LABELS = new Map<string, string>([
  ["facebook", "Facebook"],
  ["tiktok", "TikTok"],
  ["youtube", "YouTube"],
  ["threads", "Threads"],
  ["review", "Review"],
  ["news", "Tin tức"],
  ["tin tức", "Tin tức"],
  ["tin tức/báo chí", "Tin tức/Báo chí"],
  ["website", "Website"],
  ["website/blog", "Website/Blog"],
  ["google maps", "Google Maps"],
  ["sàn thương mại điện tử", "Sàn thương mại điện tử"],
]);

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeEmailDomain(value: unknown) {
  return text(value, 253).toLowerCase().replace(/^@+/, "");
}

function normalizePlatforms(value: unknown) {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value
        .map((item) => text(item, 80))
        .filter(Boolean)
        .map((item) => PLATFORM_LABELS.get(item.toLocaleLowerCase("vi-VN")))
        .filter((item): item is string => Boolean(item)),
    ),
  ].slice(0, 12);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const fullName = text(body.fullName, 120);
    const email = text(body.email, 180).toLowerCase();
    const phone = text(body.phone, 40);
    const company = text(body.company || body.brandName, 180);
    const taxId = text(body.taxId, 40);
    const industry = text(body.industry, 120);
    const need = text(body.need, 180) || "Đăng ký dùng thử và cấu hình Workspace";
    const companyEmailDomain = normalizeEmailDomain(body.companyEmailDomain);
    const configurationNotes = text(body.configurationNotes, 2000);
    const keywords = Array.isArray(body.keywords)
      ? [...new Set(body.keywords.map((item: unknown) => text(item, 120)).filter(Boolean))].slice(0, 40)
      : [];
    const platforms = normalizePlatforms(Array.isArray(body.platforms) ? body.platforms : body.channels);

    if (!fullName || !email || !phone || !company || !industry) {
      return NextResponse.json(
        {
          error: "Vui lòng nhập đầy đủ họ tên, email, số điện thoại, công ty / thương hiệu và ngành hàng.",
        },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email không đúng định dạng." }, { status: 400 });
    }

    if (companyEmailDomain && !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(companyEmailDomain)) {
      return NextResponse.json({ error: "Đuôi email doanh nghiệp không đúng định dạng." }, { status: 400 });
    }

    if (platforms.length === 0) {
      return NextResponse.json({ error: "Vui lòng chọn ít nhất một kênh theo dõi." }, { status: 400 });
    }

    const consultation = await createConsultation({
      fullName,
      email,
      phone,
      company,
      taxId,
      industry,
      need,
      companyEmailDomain,
      keywords,
      platforms,
      configurationNotes,
      requestSource: "trial-registration",
      status: "pending",
      notes: "",
      contactPlan: "",
      configurationEmbedded: true,
      trialRegistration: true,
      consultationConfirmationEmailStatus: "sending",
    });

    let emailSent = false;
    try {
      await sendConsultationEmail({
        kind: "received",
        toEmail: email,
        toName: fullName,
        requestId: consultation.id,
        company,
        need,
      });
      emailSent = true;
      await updateConsultation(consultation.id, {
        consultationConfirmationEmailStatus: "sent",
        consultationConfirmationEmailSentAt: new Date().toISOString(),
        consultationConfirmationEmailError: undefined,
      }).catch((updateError) => {
        console.error("[Consultations API] cannot persist sent email status:", updateError);
      });
    } catch (emailError) {
      console.error("[Consultations API] registration thank-you email error:", emailError);
      const emailErrorMessage = emailError instanceof Error
        ? emailError.message
        : "EmailJS trả về lỗi không xác định.";
      await updateConsultation(consultation.id, {
        consultationConfirmationEmailStatus: "failed",
        consultationConfirmationEmailError: emailErrorMessage.slice(0, 500),
      }).catch((updateError) => {
        console.error("[Consultations API] cannot persist email failure:", updateError);
      });
    }

    return NextResponse.json(
      { success: true, consultationId: consultation.id, emailSent },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Consultations API] submit error:", error);
    return NextResponse.json({ error: "Chưa thể gửi yêu cầu. Vui lòng thử lại sau." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const consultationId = text(body.consultationId, 120);
    const email = text(body.email, 180).toLowerCase();
    const need = text(body.need, 180);
    const consultationNotes = text(body.consultationNotes, 2000);

    if (!consultationId || !email || !need) {
      return NextResponse.json(
        { error: "Vui lòng chọn nhu cầu chính trước khi gửi thông tin tư vấn." },
        { status: 400 },
      );
    }

    const consultation = await getConsultation(consultationId);
    if (!consultation) {
      return NextResponse.json({ error: "Không tìm thấy yêu cầu dùng thử." }, { status: 404 });
    }

    if (text(consultation.email, 180).toLowerCase() !== email || consultation.requestSource !== "trial-registration") {
      return NextResponse.json({ error: "Thông tin xác nhận yêu cầu không hợp lệ." }, { status: 403 });
    }

    await updateConsultation(consultationId, {
      need,
      consultationNotes,
      consultationRequested: true,
    });

    let emailSent = Boolean(consultation.consultationConfirmationEmailSentAt);
    if (!emailSent) {
      try {
        await sendConsultationEmail({
          kind: "received",
          toEmail: email,
          toName: text(consultation.fullName, 120) || "Quý khách",
          requestId: consultationId,
          company: text(consultation.company, 180),
          need,
        });
        emailSent = true;
        await updateConsultation(consultationId, {
          consultationConfirmationEmailStatus: "sent",
          consultationConfirmationEmailSentAt: new Date().toISOString(),
          consultationConfirmationEmailError: undefined,
        });
      } catch (emailError) {
        console.error("[Consultations API] confirmation email error:", emailError);
        const emailErrorMessage = emailError instanceof Error
          ? emailError.message
          : "EmailJS trả về lỗi không xác định.";
        await updateConsultation(consultationId, {
          consultationConfirmationEmailStatus: "failed",
          consultationConfirmationEmailError: emailErrorMessage.slice(0, 500),
        });
      }
    }

    return NextResponse.json({ success: true, emailSent });
  } catch (error) {
    console.error("[Consultations API] follow-up error:", error);
    return NextResponse.json(
      { error: "Chưa thể bổ sung thông tin tư vấn. Vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
