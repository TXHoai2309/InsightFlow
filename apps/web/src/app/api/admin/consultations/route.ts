import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyBearerToken } from "@/lib/server/auth";
import { authAdmin, db } from "@/lib/server/firebaseAdmin";
import { sendConsultationEmail } from "@/lib/server/consultationEmail";
import {
  getCrawlRun,
  updateCrawlRun,
} from "@/lib/server/crawlRuns";
import {
  getConsultation,
  listConsultations,
  updateConsultation,
} from "@/lib/server/vpsOperationalStore";

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

const ACTIVE_CRAWL_STATUSES = new Set(["queued", "waiting_resource", "running", "labeling", "syncing"]);
const PLATFORM_ALIASES: Record<string, string> = {
  facebook: "facebook",
  threads: "threads",
  tiktok: "tiktok",
  youtube: "youtube",
  review: "google_maps",
  reviews: "google_maps",
  google_maps: "google_maps",
  "google maps": "google_maps",
  "tin tức": "news_html",
  "tin tuc": "news_html",
  news: "news_html",
  news_html: "news_html",
  website: "website",
};

const TRIAL_SUPPORTED_PLATFORMS = new Set([
  "facebook",
  "threads",
  "tiktok",
  "youtube",
  "google_maps",
  "news_html",
]);

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function textList(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value
    .map((item) => text(item, maxLength))
    .filter(Boolean)))
    .slice(0, maxItems);
}

function normalizePlatforms(platforms: string[]) {
  return Array.from(new Set(platforms
    .map((platform) => PLATFORM_ALIASES[platform.toLowerCase()])
    .filter((platform): platform is string => Boolean(platform) && TRIAL_SUPPORTED_PLATFORMS.has(platform))));
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

function timestampToDate(value: unknown) {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

function resolvePublicAppUrl(request: NextRequest) {
  const configuredUrl = text(process.env.NEXT_PUBLIC_APP_URL, 500).replace(/\/$/, "");
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const requestHost = forwardedHost || request.headers.get("host")?.trim() || request.nextUrl.host;
  const requestIsLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestHost);
  const configuredIsLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredUrl);

  if (configuredUrl && (!configuredIsLocal || requestIsLocal)) {
    return configuredUrl;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto || request.nextUrl.protocol.replace(":", "") || (requestIsLocal ? "http" : "https");
  return `${protocol}://${requestHost}`;
}

async function hasPublishedTrialPosts(brandSlug: string) {
  const baseUrl = text(process.env.NEXT_PUBLIC_SUPABASE_URL, 500)
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "");
  const serviceKey = text(process.env.SUPABASE_SERVICE_ROLE_KEY, 1000);
  if (!baseUrl || !serviceKey) {
    throw new Error("Supabase chưa được cấu hình để xác minh dữ liệu trial.");
  }
  const query = new URLSearchParams({
    select: "post_id",
    brand_slug: `eq.${brandSlug}`,
    crawl_status: "eq.active",
    limit: "1",
  });
  const response = await fetch(`${baseUrl}/rest/v1/posts?${query}`, {
    cache: "no-store",
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  if (!response.ok) {
    throw new Error(`Không thể xác minh dữ liệu trial trên Supabase (${response.status}).`);
  }
  const rows = await response.json();
  return Array.isArray(rows) && rows.length > 0;
}

async function resolveAutomaticAccount(
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
      return { email, userRecord: existingUser, profile: profile.data() || {} };
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
  if (token.role === "admin") return token;
  const profile = await db.collection("users").doc(token.uid).get();
  const role = profile.data()?.role || token.role;
  return role === "admin" ? token : null;
}

function serializeValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
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

    const storedConsultations = await listConsultations(500);
    const runIds = Array.from(new Set(storedConsultations
      .map((consultation) => text(consultation.trialCrawlRunId, 120))
      .filter(Boolean)));
    const runs = await Promise.all(runIds.map((runId) => getCrawlRun(runId)));
    const runStatuses = new Map(runs
      .filter((run): run is NonNullable<typeof run> => Boolean(run))
      .map((run) => [run.id, run.status]));
    const consultations = storedConsultations.map((data) => {
      const runId = text(data.trialCrawlRunId, 120);
      return {
        ...(serializeValue(data) as Record<string, unknown>),
        ...(runId && runStatuses.has(runId) ? { trialCrawlStatus: runStatuses.get(runId) } : {}),
      };
    });

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
    const action = text(body.action, 80);
    const status = text(body.status, 40);
    const notes = text(body.notes, 3000);
    const contactPlan = text(body.contactPlan, 1000);

    if (!id) {
      return NextResponse.json({ error: "Dữ liệu cập nhật không hợp lệ." }, { status: 400 });
    }

    const consultation = await getConsultation(id);
    if (!consultation) {
      return NextResponse.json({ error: "Không tìm thấy yêu cầu tư vấn." }, { status: 404 });
    }

    const currentStatus = text(consultation.status, 40) || "pending";

    if (action === "update_trial_configuration") {
      const company = text(body.company, 180);
      const keywords = textList(body.keywords, 50, 120);
      const platforms = textList(body.platforms, 20, 80);
      const normalizedPlatforms = normalizePlatforms(platforms);
      const configurationNotes = text(body.configurationNotes, 3000);
      const crawlRunId = text(consultation.trialCrawlRunId, 120);
      const crawlRun = crawlRunId ? await getCrawlRun(crawlRunId) : null;
      const crawlStatus = crawlRun
        ? crawlRun.status
        : text(consultation.trialCrawlStatus, 40);

      if (!company || keywords.length === 0 || normalizedPlatforms.length === 0) {
        return NextResponse.json(
          { error: "Cấu hình trial cần tên thương hiệu, ít nhất một từ khóa và một kênh hợp lệ." },
          { status: 400 },
        );
      }
      if (ACTIVE_CRAWL_STATUSES.has(crawlStatus) && crawlStatus !== "queued") {
        return NextResponse.json(
          { error: "Phiên cào đang chạy. Hãy dừng hoặc chờ phiên hiện tại kết thúc trước khi sửa cấu hình." },
          { status: 409 },
        );
      }

      const configuration = { brandName: company, keywords, platforms: normalizedPlatforms };
      await updateConsultation(id, {
        company,
        keywords,
        platforms: normalizedPlatforms,
        configurationNotes,
        trialCrawlConfiguration: configuration,
      });
      if (crawlStatus === "queued" && crawlRunId) {
        await updateCrawlRun(crawlRunId, {
          platforms: normalizedPlatforms,
          metadata: {
            ...(crawlRun?.metadata || {}),
            brandName: company,
            keywords,
            configurationNotes,
          },
        });
      }
      return NextResponse.json({ success: true, configuration });
    }

    if (!action && !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Dữ liệu cập nhật không hợp lệ." }, { status: 400 });
    }
    if (!action && FINAL_STATUSES.has(currentStatus) && status !== currentStatus) {
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

    if (action === "publish_trial_data") {
      if (currentStatus !== "completed") {
        return NextResponse.json({ error: "Yêu cầu cần được duyệt trước khi xuất bản dữ liệu trial." }, { status: 409 });
      }
      const crawlRunId = text(consultation.trialCrawlRunId, 120);
      const crawlRun = crawlRunId ? await getCrawlRun(crawlRunId) : null;
      if (!crawlRun || crawlRun.status !== "completed") {
        return NextResponse.json({ error: "Chỉ có thể xuất bản sau khi trial crawl hoàn tất." }, { status: 409 });
      }
      const crawlRunMetadata = crawlRun.metadata;
      const trialBrandSlug = crawlRunMetadata && typeof crawlRunMetadata === "object"
        ? text((crawlRunMetadata as Record<string, unknown>).trialBrandSlug, 100)
        : "";
      const brandId = trialBrandSlug
        || `trial-${slugify(company)}-${crawlRunId.slice(0, 8).toLowerCase()}`;
      if (!(await hasPublishedTrialPosts(brandId))) {
        return NextResponse.json(
          { error: "Chưa tìm thấy dữ liệu trial đã đồng bộ trên Supabase. Hãy kiểm tra bước sync của worker." },
          { status: 409 },
        );
      }
      const publishedAt = new Date().toISOString();
      await updateCrawlRun(crawlRunId, {
        currentPhase: "published",
        metadata: { ...(crawlRun.metadata || {}), trialBrandSlug: brandId, trialPublishedAt: publishedAt },
      });
      await updateConsultation(id, {
        trialDataStatus: "published",
        trialPublishedAt: publishedAt,
        trialBrandSlug: brandId,
        notes,
        contactPlan,
      });
      return NextResponse.json({ success: true, brandSlug: brandId, publishedAt });
    }

    if (action === "create_trial_account") {
      if (currentStatus !== "completed") {
        return NextResponse.json({ error: "Yêu cầu cần được duyệt trước khi tạo tài khoản." }, { status: 409 });
      }
      const crawlRunId = text(consultation.trialCrawlRunId, 120);
      const crawlRun = crawlRunId ? await getCrawlRun(crawlRunId) : null;
      if (!crawlRun || crawlRun.status !== "completed") {
        return NextResponse.json({ error: "Chỉ có thể tạo tài khoản sau khi trial crawl hoàn tất." }, { status: 409 });
      }
      const brandId = text(consultation.trialBrandSlug, 100)
        || text(crawlRun.metadata?.trialBrandSlug, 100)
        || `trial-${slugify(company)}-${crawlRunId.slice(0, 8).toLowerCase()}`;
      const publishedAt = text(consultation.trialPublishedAt, 80)
        || text(crawlRun.metadata?.trialPublishedAt, 80);
      if (!publishedAt || !(await hasPublishedTrialPosts(brandId))) {
        return NextResponse.json({ error: "Hãy xuất bản dữ liệu trial trước khi tạo tài khoản." }, { status: 409 });
      }
      if (!companyEmailDomain) {
        return NextResponse.json(
          { error: "Yêu cầu chưa có đuôi email doanh nghiệp nên chưa thể tự tạo tài khoản." },
          { status: 400 },
        );
      }
      const requestedTrialDays = body.trialDays === undefined ? 14 : Number(body.trialDays);
      if (requestedTrialDays !== 7 && requestedTrialDays !== 14) {
        return NextResponse.json({ error: "Thời hạn dùng thử chỉ hỗ trợ 7 hoặc 14 ngày." }, { status: 400 });
      }
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
        const automaticAccount = await resolveAutomaticAccount(requesterName, companyEmailDomain);
        accountEmail = automaticAccount.email;
        userRecord = automaticAccount.userRecord;
        userProfile = automaticAccount.profile;
      }

      const accountAlreadyExisted = Boolean(userRecord);
      const trialAccount = userProfile.trialAccount === true || !accountAlreadyExisted;

      if (userRecord) {
        userRecord = await authAdmin.updateUser(userRecord.uid, {
          email: accountEmail,
          displayName: userRecord.displayName || requesterName,
          disabled: false,
        });
      } else {
        userRecord = await authAdmin.createUser({
          email: accountEmail,
          displayName: requesterName,
          emailVerified: false,
          disabled: false,
        });
      }

      const existingTrialStart = timestampToDate(consultation.provisionedTrialStartAt);
      const existingTrialEnd = timestampToDate(consultation.provisionedTrialEndsAt);
      const storedTrialDays = Number(consultation.trialDays);
      const trialDays = existingTrialStart && (storedTrialDays === 7 || storedTrialDays === 14)
        ? storedTrialDays as 7 | 14
        : requestedTrialDays as 7 | 14;
      const trialStartAt = existingTrialStart || new Date();
      const trialEndsAt = existingTrialEnd || new Date(trialStartAt.getTime() + trialDays * 24 * 60 * 60 * 1000);
      const trialPlan = `${trialDays}_day_trial`;

      const existingClaims = userRecord.customClaims || {};
      const brandIds = Array.from(new Set([
        ...(Array.isArray(existingClaims.brandIds) ? existingClaims.brandIds : []),
        ...(Array.isArray(userProfile.brandIds) ? userProfile.brandIds : []),
        ...(Array.isArray(userProfile.workspaceIds) ? userProfile.workspaceIds : []),
        ...(text(existingClaims.brandId, 100) ? [text(existingClaims.brandId, 100)] : []),
        ...(text(userProfile.brandId, 100) ? [text(userProfile.brandId, 100)] : []),
        brandId,
      ]));
      const permissions = Array.from(new Set([
        ...(Array.isArray(existingClaims.permissions) ? existingClaims.permissions : []),
        ...BRAND_MANAGER_PERMISSIONS,
      ]));
      const trialConsultationIds = Array.from(new Set([
        ...(Array.isArray(userProfile.trialConsultationIds) ? userProfile.trialConsultationIds : []),
        ...(text(userProfile.createdFromConsultationId, 120) ? [text(userProfile.createdFromConsultationId, 120)] : []),
        id,
      ]));
      await authAdmin.setCustomUserClaims(userRecord.uid, {
        ...existingClaims,
        role: text(existingClaims.role, 50) || "brand_manager",
        brandId: text(existingClaims.brandId, 100) || brandId,
        brandName: text(existingClaims.brandName, 180) || company,
        brandIds,
        workspaceIds: brandIds,
        trialConsultationIds,
        permissions,
        defaultRoute: "/dashboard",
        trialPlan,
        trialDays,
        trialAccount,
        trialStartAt: trialStartAt.toISOString(),
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
        role: text(userProfile.role, 50) || "brand_manager",
        brandId: text(userProfile.brandId, 100) || brandId,
        brandName: text(userProfile.brandName, 180) || company,
        brandIds,
        workspaceIds: brandIds,
        trialConsultationIds,
        companyDomain: companyEmailDomain || accountEmail.split("@")[1] || "",
        permissions,
        defaultRoute: "/dashboard",
        disabled: false,
        temporaryPasswordIssued: false,
        trialPlan,
        trialDays,
        trialAccount,
        trialStartAt,
        trialEndsAt,
        updatedAt: FieldValue.serverTimestamp(),
        ...(!userSnapshot.exists ? {
          createdAt: FieldValue.serverTimestamp(),
          createdFromConsultationId: id,
          createdBy: admin.uid,
        } : {}),
      }, { merge: true });
      batch.set(db.collection("brands").doc(brandId), {
        id: brandId,
        name: company,
        domain: companyEmailDomain || accountEmail.split("@")[1] || "",
        brandManagerUid: userRecord.uid,
        brandManagerEmail: accountEmail,
        trialConsultationId: id,
        trialPlan,
        trialDays,
        trialStartAt,
        trialEndsAt,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      batch.set(db.collection("brands").doc(brandId).collection("members").doc(userRecord.uid), {
        uid: userRecord.uid,
        email: accountEmail,
        role: "brand_manager",
        permissions: BRAND_MANAGER_PERMISSIONS,
        addedFromConsultationId: id,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      await updateConsultation(id, {
        provisionedAccountUid: userRecord.uid,
        provisionedAccountEmail: accountEmail,
        provisionedTrialStartAt: trialStartAt.toISOString(),
        provisionedTrialEndsAt: trialEndsAt.toISOString(),
        trialPlan,
        trialDays,
        accountStatus: "created",
        decisionEmailStatus: "not_sent",
        notes,
        contactPlan,
      });
      await batch.commit();

      return NextResponse.json({
        success: true,
        accountCreated: true,
        account: {
          email: accountEmail,
          brandName: company,
          brandSlug: brandId,
          role: "Brand Manager",
          platforms: normalizePlatforms(textList(consultation.platforms, 20, 80)),
          trialDays,
          trialEndsAt: trialEndsAt.toISOString(),
        },
      });
    }

    if (action === "send_trial_activation") {
      const userUid = text(consultation.provisionedAccountUid, 128);
      const accountEmail = text(consultation.provisionedAccountEmail, 180).toLowerCase();
      if (!userUid || !accountEmail) {
        return NextResponse.json({ error: "Hãy tạo tài khoản dùng thử trước khi gửi link kích hoạt." }, { status: 409 });
      }
      const trialEndsAt = timestampToDate(consultation.provisionedTrialEndsAt)
        || timestampToDate(consultation.trialEndsAt)
        || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const storedTrialDays = Number(consultation.trialDays);
      const trialDays = storedTrialDays === 7 ? 7 : 14;
      const trialPlan = `${trialDays}_day_trial`;
      const appUrl = resolvePublicAppUrl(request);
      const activationLink = await authAdmin.generatePasswordResetLink(accountEmail, {
        url: `${appUrl}/login`,
        handleCodeInApp: false,
      });
      await updateConsultation(id, {
        accountStatus: "created",
        decisionEmailStatus: "sending",
        notes,
        contactPlan,
      });

      try {
        await sendConsultationEmail({
          kind: "approved",
          toEmail: requesterEmail,
          toName: requesterName,
          requestId: id,
          company,
          need,
          accountEmail,
          activationLink,
          trialDays,
          trialEndsAt,
        });
      } catch (emailError) {
        console.error("[Admin consultations API] approval email error:", emailError);
        const emailErrorMessage = emailError instanceof Error
          ? emailError.message
          : "EmailJS trả về lỗi không xác định.";
        await updateConsultation(id, {
          accountStatus: "email_failed",
          decisionEmailStatus: "failed",
          decisionEmailError: emailErrorMessage.slice(0, 500),
        });
        return NextResponse.json(
          {
            error: `Tài khoản đã được tạo nhưng EmailJS chưa gửi được link kích hoạt. ${emailErrorMessage}`,
          },
          { status: 502 },
        );
      }

      const sentAt = new Date().toISOString();
      await updateConsultation(id, {
          status: "completed",
          approvedAccountUid: userUid,
          approvedAccountEmail: accountEmail,
          approvedAt: text(consultation.approvedAt, 80) || sentAt,
          approvedBy: admin.uid,
          trialPlan,
          trialDays,
          trialStartAt: timestampToDate(consultation.provisionedTrialStartAt)?.toISOString(),
          trialEndsAt: trialEndsAt.toISOString(),
          accountStatus: "sent",
          decisionEmailStatus: "sent",
          decisionEmailError: undefined,
          decisionEmailSentAt: sentAt,
          notes,
          contactPlan,
      });
      return NextResponse.json({
        success: true,
        emailSent: true,
        sentAt,
        account: {
          email: accountEmail,
          trialEndsAt: trialEndsAt.toISOString(),
        },
      });
    }

    if (status === "completed" && currentStatus !== "completed") {
      await updateConsultation(id, {
        status: "completed",
        approvedAt: new Date().toISOString(),
        approvedBy: admin.uid,
        accountStatus: "not_created",
        notes,
        contactPlan,
      });
      return NextResponse.json({ success: true, approved: true, accountCreated: false, emailSent: false });
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
        await updateConsultation(id, {
          decisionEmailStatus: "failed",
          decisionEmailError: emailErrorMessage.slice(0, 500),
        });
        return NextResponse.json(
          { error: `EmailJS chưa gửi được email từ chối. ${emailErrorMessage}` },
          { status: 502 },
        );
      }

      await updateConsultation(id, {
        status: "not_approved",
        rejectedAt: new Date().toISOString(),
        rejectedBy: admin.uid,
        decisionEmailStatus: "sent",
        decisionEmailError: undefined,
        decisionEmailSentAt: new Date().toISOString(),
        notes,
        contactPlan,
      });
      return NextResponse.json({ success: true, emailSent: true });
    }

    await updateConsultation(id, { status, notes, contactPlan });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin consultations API] update error:", error);
    return NextResponse.json({ error: "Chưa thể cập nhật yêu cầu tư vấn." }, { status: 500 });
  }
}
