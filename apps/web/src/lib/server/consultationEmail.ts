type ConsultationEmailKind = "received" | "approved" | "rejected";

interface ConsultationEmailInput {
  kind: ConsultationEmailKind;
  toEmail: string;
  toName: string;
  requestId: string;
  company: string;
  need: string;
  accountEmail?: string;
  activationLink?: string;
  trialDays?: 7 | 14;
  trialEndsAt?: Date;
}

const SUBJECTS: Record<ConsultationEmailKind, string> = {
  received: "InsightFlow đã nhận yêu cầu tư vấn của bạn",
  approved: "Yêu cầu dùng thử InsightFlow của bạn đã được duyệt",
  rejected: "Thông báo kết quả yêu cầu tư vấn InsightFlow",
};

function buildMessage(input: ConsultationEmailInput) {
  if (input.kind === "received") {
    return [
      `Xin chào ${input.toName},`,
      "",
      "Bạn đã gửi yêu cầu tư vấn thành công.",
      `Mã yêu cầu: ${input.requestId}`,
      `Doanh nghiệp: ${input.company}`,
      `Nhu cầu chính: ${input.need}`,
      "",
      "Vui lòng chờ đội ngũ InsightFlow xem xét và phản hồi yêu cầu của bạn.",
      "",
      "Trân trọng,",
      "Đội ngũ InsightFlow",
    ].join("\n");
  }

  if (input.kind === "approved") {
    const trialEndLabel = input.trialEndsAt?.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      dateStyle: "full",
      timeStyle: "short",
    }) || "";
    return [
      `Xin chào ${input.toName},`,
      "",
      "Cảm ơn bạn đã tin tưởng và lựa chọn InsightFlow.",
      "Yêu cầu tư vấn và dùng thử InsightFlow của bạn đã được duyệt.",
      `Mã yêu cầu: ${input.requestId}`,
      `Doanh nghiệp: ${input.company}`,
      "",
      `Tài khoản của bạn được sử dụng miễn phí trong ${input.trialDays || 14} ngày.`,
      ...(trialEndLabel ? [`Thời hạn dùng thử đến: ${trialEndLabel}`] : []),
      "",
      "Thông tin tài khoản dùng thử:",
      `Email đăng nhập: ${input.accountEmail}`,
      "InsightFlow không gửi mật khẩu cố định qua email.",
      `Thiết lập mật khẩu và kích hoạt tài khoản tại: ${input.activationLink}`,
      "",
      "Link chỉ dùng một lần và có thời hạn theo chính sách bảo mật của Firebase. Nếu link hết hạn, vui lòng liên hệ InsightFlow để được gửi lại.",
      "",
      "Trân trọng,",
      "Đội ngũ InsightFlow",
    ].join("\n");
  }

  return [
    `Xin chào ${input.toName},`,
    "",
    "Rất tiếc, yêu cầu tư vấn và dùng thử InsightFlow của bạn chưa được duyệt tại thời điểm này.",
    `Mã yêu cầu: ${input.requestId}`,
    `Doanh nghiệp: ${input.company}`,
    "",
    "Bạn có thể liên hệ lại với InsightFlow khi cần bổ sung thông tin hoặc gửi một yêu cầu mới.",
    "",
    "Trân trọng,",
    "Đội ngũ InsightFlow",
  ].join("\n");
}

function getTemplateId(kind: ConsultationEmailKind) {
  const dedicatedTemplate = {
    received: process.env.EMAILJS_CONSULTATION_RECEIVED_TEMPLATE_ID,
    approved: process.env.EMAILJS_CONSULTATION_APPROVED_TEMPLATE_ID,
    rejected: process.env.EMAILJS_CONSULTATION_REJECTED_TEMPLATE_ID,
  }[kind];

  return dedicatedTemplate || process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
}

export async function sendConsultationEmail(input: ConsultationEmailInput) {
  const serviceId = process.env.EMAILJS_SERVICE_ID || process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = getTemplateId(input.kind);
  const publicKey = process.env.EMAILJS_PUBLIC_KEY || process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error("EmailJS chưa được cấu hình đầy đủ.");
  }

  const subject = SUBJECTS[input.kind];
  const message = buildMessage(input);
  const payload: Record<string, unknown> = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email: input.toEmail,
      email: input.toEmail,
      to_name: input.toName,
      user_name: input.toName,
      name: input.toName,
      time: new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
      subject,
      title: subject,
      message,
      content: message,
      request_id: input.requestId,
      company: input.company,
      need: input.need,
      status: input.kind,
      account_email: input.accountEmail || "",
      login_email: input.accountEmail || "",
      activation_link: input.activationLink || "",
      login_url: input.activationLink || "",
      trial_days: input.trialDays || 14,
      trial_ends_at: input.trialEndsAt?.toISOString() || "",
    },
  };

  if (privateKey) payload.accessToken = privateKey;

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = (await response.text()).trim();
    throw new Error(`EmailJS gửi email thất bại (${response.status})${detail ? `: ${detail}` : ""}`);
  }
}
