import assert from "node:assert/strict";
import test from "node:test";
import { sendConsultationEmail } from "./consultationEmail";

test("sends a trial-registration thank-you email before approval", async () => {
  const originalFetch = globalThis.fetch;
  const originalServiceId = process.env.EMAILJS_SERVICE_ID;
  const originalTemplateId = process.env.EMAILJS_CONSULTATION_RECEIVED_TEMPLATE_ID;
  const originalPublicKey = process.env.EMAILJS_PUBLIC_KEY;
  let payload: Record<string, any> | undefined;

  process.env.EMAILJS_SERVICE_ID = "service-test";
  process.env.EMAILJS_CONSULTATION_RECEIVED_TEMPLATE_ID = "template-test";
  process.env.EMAILJS_PUBLIC_KEY = "public-test";
  globalThis.fetch = async (_input, init) => {
    payload = JSON.parse(String(init?.body));
    return new Response(null, { status: 200 });
  };

  try {
    await sendConsultationEmail({
      kind: "received",
      toEmail: "customer@example.com",
      toName: "Nguyễn An",
      requestId: "trial-123",
      company: "Công ty An",
      need: "Đăng ký dùng thử",
    });

    assert.equal(payload?.template_params.to_email, "customer@example.com");
    assert.equal(
      payload?.template_params.subject,
      "Cảm ơn bạn đã đăng ký dùng thử InsightFlow",
    );
    assert.match(payload?.template_params.message, /đã được hệ thống tiếp nhận thành công/);
    assert.match(payload?.template_params.message, /chưa được phê duyệt hoặc kích hoạt/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalServiceId === undefined) delete process.env.EMAILJS_SERVICE_ID;
    else process.env.EMAILJS_SERVICE_ID = originalServiceId;
    if (originalTemplateId === undefined) {
      delete process.env.EMAILJS_CONSULTATION_RECEIVED_TEMPLATE_ID;
    } else {
      process.env.EMAILJS_CONSULTATION_RECEIVED_TEMPLATE_ID = originalTemplateId;
    }
    if (originalPublicKey === undefined) delete process.env.EMAILJS_PUBLIC_KEY;
    else process.env.EMAILJS_PUBLIC_KEY = originalPublicKey;
  }
});
