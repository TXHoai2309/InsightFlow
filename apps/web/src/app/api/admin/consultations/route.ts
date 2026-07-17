import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { verifyBearerToken } from "@/lib/server/auth";
import { authAdmin, db } from "@/lib/server/firebaseAdmin";
import { sendConsultationEmail } from "@/lib/server/consultationEmail";

const ALLOWED_STATUSES = new Set(["pending", "contacting", "completed", "unreachable", "not_approved"]);
const FINAL_STATUSES = new Set(["completed", "not_approved"]);
const BRAND_MANAGER_PERMISSIONS = [
  "dashboard",
  "mentions",
  "alerts",
  "leads",
  "reports",
  "brand_settings",
  "staff_management",
];

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "trial-brand";
}

function isAuthUserNotFound(error: any) {
  return error?.code === "auth/user-not-found" || error?.errorInfo?.code === "auth/user-not-found";
}

function emailLocalPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 48) || "brand.manager";
}

function generateTemporaryPassword() {
  return `IF@Trial${randomInt(100000, 1000000)}x`;
}

function timestampToDate(value: unknown) {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

function resolvePublicLoginUrl(request: NextRequest) {
  const configuredUrl = text(process.env.NEXT_PUBLIC_APP_URL, 500).replace(/\/$/, "");
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const requestHost = forwardedHost || request.headers.get("host")?.trim() || request.nextUrl.host;
  const requestIsLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestHost);
  const configuredIsLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredUrl);

  if (configuredUrl && (!configuredIsLocal || requestIsLocal)) {
    return `${configuredUrl}/login`;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto || request.nextUrl.protocol.replace(":", "") || (requestIsLocal ? "http" : "https");
  return `${protocol}://${requestHost}/login`;
}

async function resolveAutomaticAccount(
  consultationId: string,
  fullName: string,
  companyEmailDomain: string,
) {
  const base = emailLocalPart(fullName);
  for (let index = 0; index < 100; index += 1) {
    const suffix = index === 0 ? "" : String(index + 1);
    const email = `${base}${suffix}@${companyEmailDomain}`;
    try {
      const existingUser = await authAdmin.getUserByEmail(email);
      const profile = await db.collection("users").doc(existingUser.uid).get();
      if (profile.data()?.createdFromConsultationId === consultationId) {
        return { email, userRecord: existingUser, profile: profile.data() || {} };
      }
    } catch (error: any) {
      if (isAuthUserNotFound(error)) {
        return { email, userRecord: null, profile: {} };
      }
      throw error;
    }
  }
  throw new Error("Không thể tạo email tài khoản không trùng. Vui lòng kiểm tra lại đuôi email doanh nghiệp.");
}

async function requireAdmin(request: NextRequest) {
  const token = await verifyBearerToken(request.headers.get("authorization"));
  if (!token) return null;
  const profile = await db.collection("users").doc(token.uid).get();
  const role = profile.data()?.role || token.role;
  return role === "admin" ? token : null;
}

function serializeValue(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, serializeValue(item)]));
  }
  return value;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: "Bạn không có quyền xem yêu cầu tư vấn." }, { status: 403 });
    }

    const snapshot = await db.collection("consultations").orderBy("createdAt", "desc").limit(500).get();
    const consultations = snapshot.docs.map((document: any) => ({
      id: document.id,
      ...(serializeValue(document.data()) as Record<string, unknown>),
    }));

    return NextResponse.json({ consultations });
  } catch (error) {
    console.error("[Admin consultations API] load error:", error);
    return NextResponse.json({ error: "Chưa thể tải danh sách yêu cầu tư vấn." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Bạn không có quyền cập nhật yêu cầu tư vấn." }, { status: 403 });
    }

    const body = await request.json();
    const id = text(body.id, 120);
    const status = text(body.status, 40);
    const notes = text(body.notes, 3000);
    const contactPlan = text(body.contactPlan, 1000);

    if (!id || !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Dữ liệu cập nhật không hợp lệ." }, { status: 400 });
    }

    const reference = db.collection("consultations").doc(id);
    const snapshot = await reference.get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: "Không tìm thấy yêu cầu tư vấn." }, { status: 404 });
    }

    const consultation = snapshot.data() || {};
    const currentStatus = text(consultation.status, 40) || "pending";
    if (FINAL_STATUSES.has(currentStatus) && status !== currentStatus) {
      return NextResponse.json(
        { error: "Yêu cầu đã có quyết định cuối cùng và không thể đổi sang trạng thái khác." },
        { status: 409 },
      );
    }

    const requesterEmail = text(consultation.email, 180).toLowerCase();
    const requesterName = text(consultation.fullName, 120) || "Quý khách";
    const company = text(consultation.company, 180);
    const need = text(consultation.need, 180);
    const companyEmailDomain = text(consultation.companyEmailDomain, 253).toLowerCase().replace(/^@+/, "");

    if (status === "completed" && currentStatus !== "completed") {
      if (!companyEmailDomain) {
        return NextResponse.json(
          { error: "Yêu cầu chưa có đuôi email doanh nghiệp nên chưa thể tự tạo tài khoản." },
          { status: 400 },
        );
      }

      const brandId = `${slugify(company)}-${id.slice(-6).toLowerCase()}`;
      const provisionedUid = text(consultation.provisionedAccountUid, 128);
      const provisionedEmail = text(consultation.provisionedAccountEmail, 180).toLowerCase();
      let userRecord: any;
      let userProfile: Record<string, any> = {};
      let accountEmail = provisionedEmail;

      if (provisionedUid) {
        try {
          userRecord = await authAdmin.getUser(provisionedUid);
          const profileSnapshot = await db.collection("users").doc(provisionedUid).get();
          userProfile = profileSnapshot.data() || {};
          accountEmail = provisionedEmail || text(userRecord.email, 180).toLowerCase();
        } catch (error: any) {
          if (!isAuthUserNotFound(error)) throw error;
        }
      }

      if (!userRecord) {
        const automaticAccount = await resolveAutomaticAccount(id, requesterName, companyEmailDomain);
        accountEmail = automaticAccount.email;
        userRecord = automaticAccount.userRecord;
        userProfile = automaticAccount.profile;
      }

      const accountPassword = text(userProfile.temporaryPassword, 128) || generateTemporaryPassword();
      if (userRecord) {
        userRecord = await authAdmin.updateUser(userRecord.uid, {
          email: accountEmail,
          password: accountPassword,
          displayName: requesterName,
          emailVerified: true,
          disabled: true,
        });
      } else {
        userRecord = await authAdmin.createUser({
          email: accountEmail,
          password: accountPassword,
          displayName: requesterName,
          emailVerified: true,
          disabled: true,
        });
      }

      const existingTrialStart = timestampToDate(consultation.provisionedTrialStartAt);
      const existingTrialEnd = timestampToDate(consultation.provisionedTrialEndsAt);
      const trialStartAt = existingTrialStart || new Date();
      const trialEndsAt = existingTrialEnd || new Date(trialStartAt.getTime() + 14 * 24 * 60 * 60 * 1000);

      await authAdmin.setCustomUserClaims(userRecord.uid, {
        ...(userRecord.customClaims || {}),
        role: "brand_manager",
        brandId,
        brandName: company,
        permissions: BRAND_MANAGER_PERMISSIONS,
        defaultRoute: "/dashboard",
        temporaryPasswordIssued: true,
        trialPlan: "14_day_trial",
        trialEndsAt: trialEndsAt.toISOString(),
      });

      const userRef = db.collection("users").doc(userRecord.uid);
      const userSnapshot = await userRef.get();
      const batch = db.batch();
      batch.set(userRef, {
        uid: userRecord.uid,
        email: accountEmail,
        displayName: requesterName,
        photoURL: "",
        role: "brand_manager",
        brandId,
        brandName: company,
        companyDomain: companyEmailDomain || accountEmail.split("@")[1] || "",
        permissions: BRAND_MANAGER_PERMISSIONS,
        defaultRoute: "/dashboard",
        disabled: true,
        temporaryPasswordIssued: true,
        temporaryPassword: accountPassword,
        trialPlan: "14_day_trial",
        trialStartAt,
        trialEndsAt,
        createdFromConsultationId: id,
        createdBy: admin.uid,
        updatedAt: FieldValue.serverTimestamp(),
        ...(!userSnapshot.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
      }, { merge: true });
      batch.set(db.collection("brands").doc(brandId), {
        id: brandId,
        name: company,
        domain: companyEmailDomain || accountEmail.split("@")[1] || "",
        brandManagerUid: userRecord.uid,
        brandManagerEmail: accountEmail,
        trialConsultationId: id,
        trialPlan: "14_day_trial",
        trialStartAt,
        trialEndsAt,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      batch.update(reference, {
        provisionedAccountUid: userRecord.uid,
        provisionedAccountEmail: accountEmail,
        provisionedTrialStartAt: trialStartAt,
        provisionedTrialEndsAt: trialEndsAt,
        decisionEmailStatus: "sending",
        notes,
        contactPlan,
        updatedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();

      try {
        await sendConsultationEmail({
          kind: "approved",
          toEmail: requesterEmail,
          toName: requesterName,
          requestId: id,
          company,
          need,
          accountEmail,
          temporaryPassword: accountPassword,
          trialEndsAt,
          loginUrl: resolvePublicLoginUrl(request),
        });
      } catch (emailError) {
        console.error("[Admin consultations API] approval email error:", emailError);
        const emailErrorMessage = emailError instanceof Error
          ? emailError.message
          : "EmailJS trả về lỗi không xác định.";
        await reference.update({
          decisionEmailStatus: "failed",
          decisionEmailError: emailErrorMessage.slice(0, 500),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return NextResponse.json(
          {
            error: `Tài khoản đã được chuẩn bị nhưng EmailJS chưa gửi được email. ${emailErrorMessage}`,
          },
          { status: 502 },
        );
      }

      await authAdmin.updateUser(userRecord.uid, { disabled: false });
      const finalizeBatch = db.batch();
      finalizeBatch.set(userRef, {
        disabled: false,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      finalizeBatch.update(reference, {
        status: "completed",
        approvedAccountUid: userRecord.uid,
        approvedAccountEmail: accountEmail,
        approvedAt: FieldValue.serverTimestamp(),
        approvedBy: admin.uid,
        trialPlan: "14_day_trial",
        trialStartAt,
        trialEndsAt,
        decisionEmailStatus: "sent",
        decisionEmailError: FieldValue.delete(),
        decisionEmailSentAt: FieldValue.serverTimestamp(),
        notes,
        contactPlan,
        updatedAt: FieldValue.serverTimestamp(),
      });
      try {
        await finalizeBatch.commit();
      } catch (finalizeError) {
        await authAdmin.updateUser(userRecord.uid, { disabled: true }).catch(() => undefined);
        throw finalizeError;
      }
      return NextResponse.json({
        success: true,
        accountCreated: true,
        emailSent: true,
        credentials: {
          email: accountEmail,
          temporaryPassword: accountPassword,
          trialEndsAt: trialEndsAt.toISOString(),
        },
      });
    }

    if (status === "not_approved" && currentStatus !== "not_approved") {
      try {
        await sendConsultationEmail({
          kind: "rejected",
          toEmail: requesterEmail,
          toName: requesterName,
          requestId: id,
          company,
          need,
        });
      } catch (emailError) {
        console.error("[Admin consultations API] rejection email error:", emailError);
        const emailErrorMessage = emailError instanceof Error
          ? emailError.message
          : "EmailJS trả về lỗi không xác định.";
        await reference.update({
          decisionEmailStatus: "failed",
          decisionEmailError: emailErrorMessage.slice(0, 500),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return NextResponse.json(
          { error: `EmailJS chưa gửi được email từ chối. ${emailErrorMessage}` },
          { status: 502 },
        );
      }

      await reference.update({
        status: "not_approved",
        rejectedAt: FieldValue.serverTimestamp(),
        rejectedBy: admin.uid,
        decisionEmailStatus: "sent",
        decisionEmailError: FieldValue.delete(),
        decisionEmailSentAt: FieldValue.serverTimestamp(),
        notes,
        contactPlan,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ success: true, emailSent: true });
    }

    await reference.update({ status, notes, contactPlan, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin consultations API] update error:", error);
    return NextResponse.json({ error: "Chưa thể cập nhật yêu cầu tư vấn." }, { status: 500 });
  }
}
