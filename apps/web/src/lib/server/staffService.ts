import { FieldValue } from "firebase-admin/firestore";
import { authAdmin, db, dbData } from "./firebaseAdmin";
import { validateStrongPassword } from "@/lib/passwordPolicy";
import type { DecodedIdToken } from "firebase-admin/auth";

type StaffRole = "crisis_employee" | "lead_employee";
type LegacyStaffRole = "crisis_staff" | "lead_staff";
type StaffRoleInput = StaffRole | LegacyStaffRole;

const operationPermissions = {
  dashboard: "dashboard",
  mentions: "mentions",
  alerts: "alerts",
  reports: "reports",
  leads: "leads",
} as const;

const roleAllowedPermissions: Record<StaffRole, string[]> = {
  crisis_employee: ["dashboard", "mentions", "alerts", "reports"],
  lead_employee: ["dashboard", "mentions", "leads", "reports"],
};

const assignableStaffPermissions = ["dashboard", "mentions", "alerts", "leads", "reports"];

const defaultRoutePriority: Record<StaffRole, Array<{ permission: string; route: string }>> = {
  crisis_employee: [
    { permission: "alerts", route: "/alerts" },
    { permission: "leads", route: "/leads" },
    { permission: "mentions", route: "/mentions" },
    { permission: "reports", route: "/reports" },
    { permission: "dashboard", route: "/dashboard" },
  ],
  lead_employee: [
    { permission: "leads", route: "/leads" },
    { permission: "alerts", route: "/alerts" },
    { permission: "mentions", route: "/mentions" },
    { permission: "reports", route: "/reports" },
    { permission: "dashboard", route: "/dashboard" },
  ],
};

export class StaffServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function getDomainFromEmail(email: string) {
  return email.includes("@") ? email.split("@")[1].toLowerCase() : "";
}

function normalizeStaffRole(role: unknown): StaffRole | null {
  if (role === "crisis_employee" || role === "crisis_staff") return "crisis_employee";
  if (role === "lead_employee" || role === "lead_staff") return "lead_employee";
  return null;
}

function resolvePermissions(staffRole: StaffRole, operations: unknown) {
  const requested = Array.isArray(operations) ? operations : roleAllowedPermissions[staffRole];
  const permissions = requested
    .map((item) => operationPermissions[item as keyof typeof operationPermissions])
    .filter(Boolean);
  const scoped = permissions.filter((permission) => assignableStaffPermissions.includes(permission));

  if (!scoped.includes("dashboard")) {
    scoped.unshift("dashboard");
  }

  if (!scoped.includes("alerts") && !scoped.includes("leads")) {
    throw new StaffServiceError("Vui lòng gán ít nhất một nghiệp vụ xử lý: Tiềm năng hoặc Khủng hoảng.");
  }

  return Array.from(new Set(scoped));
}

function resolveDefaultRoute(staffRole: StaffRole, permissions: string[]) {
  return defaultRoutePriority[staffRole].find((item) => permissions.includes(item.permission))?.route || "/dashboard";
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const randomPart = Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `IF@${randomPart}24`;
}

function getManagerDomain(manager: { companyDomain?: string; email?: string }) {
  return (manager.companyDomain || getDomainFromEmail(manager.email || "")).toLowerCase();
}

function belongsToManagerBrand(staffProfile: any, manager: { brandId: string; companyDomain?: string; email?: string }) {
  const managerDomain = getManagerDomain(manager);
  const staffDomain = (
    staffProfile?.companyDomain ||
    getDomainFromEmail(staffProfile?.email || "")
  ).toLowerCase();

  return staffProfile?.brandId === manager.brandId || Boolean(managerDomain && staffDomain === managerDomain);
}

function isStaffAccount(data: any, manager: { uid: string; brandId: string; companyDomain?: string; email?: string }) {
  if (!data || data.uid === manager.uid) return false;
  if (data.role === "admin" || data.role === "brand_manager") return false;
  if (normalizeStaffRole(data.role)) return true;
  return belongsToManagerBrand(data, manager);
}

function inferStaffRoleFromProfile(data: any): StaffRole {
  const normalizedRole = normalizeStaffRole(data?.role);
  if (normalizedRole) return normalizedRole;
  if (Array.isArray(data?.permissions) && data.permissions.includes("leads")) {
    return "lead_employee";
  }
  return "crisis_employee";
}

function normalizeStaffPermissions(role: StaffRole, permissions: unknown) {
  const savedPermissions = Array.isArray(permissions)
    ? permissions.filter((permission): permission is string => typeof permission === "string")
    : [];
  return savedPermissions.length > 0 ? savedPermissions : roleAllowedPermissions[role];
}

function serializeTimestamp(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    if ("toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
      return (value as { toDate: () => Date }).toDate().toISOString();
    }
    if ("_seconds" in value && typeof (value as { _seconds: number })._seconds === "number") {
      return new Date((value as { _seconds: number })._seconds * 1000).toISOString();
    }
  }
  return undefined;
}

function serializeStaffAccount(data: any, manager: { brandId: string; brandName: string }) {
  const role = inferStaffRoleFromProfile(data);
  const permissions = normalizeStaffPermissions(role, data.permissions);
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    role,
    brandId: data.brandId || manager.brandId,
    brandName: data.brandName || manager.brandName,
    permissions,
    defaultRoute: data.defaultRoute || resolveDefaultRoute(role, permissions),
    disabled: data.disabled === true,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
    hasTemporaryPassword: data.temporaryPasswordIssued === true && Boolean(data.temporaryPassword),
  };
}

async function getUserProfile(uid: string) {
  const primaryDoc = await db.collection("users").doc(uid).get();
  if (primaryDoc.exists) return primaryDoc.data();

  const secondaryDoc = await dbData.collection("users").doc(uid).get();
  if (secondaryDoc.exists) return secondaryDoc.data();

  return null;
}

function readClaim(user: DecodedIdToken, key: string): unknown {
  return (user as Record<string, unknown>)[key];
}

async function ensureBrandManager(user: DecodedIdToken) {
  const requesterProfile = await getUserProfile(user.uid);

  const role = requesterProfile?.role ?? readClaim(user, "role");
  if (role !== "brand_manager") {
    throw new StaffServiceError("Bạn cần đăng nhập bằng tài khoản Quản lý thương hiệu.", 403);
  }

  const brandId = (requesterProfile?.brandId ?? readClaim(user, "brandId")) as string | undefined;
  const brandName = (requesterProfile?.brandName ?? readClaim(user, "brandName")) as string | undefined;
  const email = (requesterProfile?.email ?? user.email) as string | undefined;

  if (!brandId || !brandName) {
    throw new StaffServiceError("Tài khoản Quản lý thương hiệu chưa được gán brand.", 400);
  }

  return {
    uid: user.uid,
    brandId,
    brandName,
    email,
    companyDomain: (requesterProfile?.companyDomain || getDomainFromEmail(email || "")) as string,
  };
}

export async function listStaff(user: DecodedIdToken) {
  const manager = await ensureBrandManager(user);

  const staffByUid = new Map<string, any>();

  try {
    const brandStaffSnapshot = await db
      .collection("brands")
      .doc(manager.brandId)
      .collection("staff")
      .get();

    brandStaffSnapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      const uid = String(data.uid || doc.id || "");
      if (!uid) return;
      staffByUid.set(uid, {
        ...data,
        uid,
        brandId: data.brandId || manager.brandId,
        brandName: data.brandName || manager.brandName,
      });
    });
  } catch (error) {
    console.warn("[StaffService] brand staff subcollection load failed:", error);
  }

  if (staffByUid.size > 0) {
    const userDocs = await Promise.all(
      Array.from(staffByUid.keys()).map(async (uid) => {
        try {
          const snapshot = await db.collection("users").doc(uid).get();
          return snapshot.exists ? { uid, data: snapshot.data() } : null;
        } catch {
          return null;
        }
      }),
    );

    userDocs.forEach((entry) => {
      if (!entry?.data) return;
      staffByUid.set(entry.uid, {
        ...staffByUid.get(entry.uid),
        ...entry.data,
        uid: entry.uid,
        brandId: entry.data.brandId || manager.brandId,
        brandName: entry.data.brandName || manager.brandName,
      });
    });

    return Array.from(staffByUid.values())
      .filter((data) => isStaffAccount(data, manager))
      .map((data) => serializeStaffAccount(data, manager));
  }

  const [primaryResult, secondaryResult] = await Promise.allSettled([
    db.collection("users").get(),
    dbData.collection("users").get(),
  ]);

  const primaryDocs = primaryResult.status === "fulfilled" ? primaryResult.value.docs : [];
  const secondaryDocs = secondaryResult.status === "fulfilled" ? secondaryResult.value.docs : [];

  if (primaryResult.status === "rejected") {
    console.warn("[StaffService] primary users load failed:", primaryResult.reason);
  }
  if (secondaryResult.status === "rejected") {
    console.warn("[StaffService] secondary users load failed:", secondaryResult.reason);
  }

  const seen = new Set<string>();
  const merged = [...primaryDocs, ...secondaryDocs]
    .map((doc) => doc.data())
    .filter((data) => {
      const uid = data.uid as string | undefined;
      if (!uid || seen.has(uid)) return false;
      seen.add(uid);
      return belongsToManagerBrand(data, manager) && isStaffAccount(data, manager);
    });

  return merged.map((data) => serializeStaffAccount(data, manager));
}

export async function createStaff(
  user: DecodedIdToken,
  body: {
    fullName?: string;
    email?: string;
    temporaryPassword?: string;
    staffRole?: StaffRoleInput;
    operations?: string[];
  },
) {
  const manager = await ensureBrandManager(user);

  const fullName = body.fullName?.trim();
  const email = body.email?.trim().toLowerCase();
  const temporaryPassword = body.temporaryPassword?.trim();
  const staffRole = normalizeStaffRole(body.staffRole);

  if (!fullName || !email || !temporaryPassword || !staffRole) {
    throw new StaffServiceError("Họ tên, email, vai trò và mật khẩu tạm thời là bắt buộc.");
  }

  const passwordPolicy = validateStrongPassword(temporaryPassword);
  if (!passwordPolicy.valid) {
    throw new StaffServiceError(passwordPolicy.errors.join(" "));
  }

  const permissions = resolvePermissions(staffRole, body.operations);
  const defaultRoute = resolveDefaultRoute(staffRole, permissions);
  const companyDomain = getDomainFromEmail(email);

  let userRecord;
  let created = false;

  try {
    userRecord = await authAdmin.getUserByEmail(email);
    await authAdmin.updateUser(userRecord.uid, {
      displayName: fullName,
      password: temporaryPassword,
      emailVerified: true,
      disabled: false,
    });
  } catch (error: any) {
    if (error.code !== "auth/user-not-found") {
      throw error;
    }

    userRecord = await authAdmin.createUser({
      email,
      password: temporaryPassword,
      displayName: fullName,
      emailVerified: true,
      disabled: false,
    });
    created = true;
  }

  await authAdmin.setCustomUserClaims(userRecord.uid, {
    role: staffRole,
    brandId: manager.brandId,
    brandName: manager.brandName,
    permissions,
    defaultRoute,
    temporaryPasswordIssued: true,
  });

  const accountPayload = {
    uid: userRecord.uid,
    email,
    displayName: fullName,
    photoURL: "",
    role: staffRole,
    brandId: manager.brandId,
    brandName: manager.brandName,
    companyDomain,
    permissions,
    defaultRoute,
    disabled: false,
    temporaryPasswordIssued: true,
    temporaryPassword,
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: manager.uid,
  };

  await db.collection("users").doc(userRecord.uid).set(
    {
      ...accountPayload,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await db
    .collection("brands")
    .doc(manager.brandId)
    .collection("staff")
    .doc(userRecord.uid)
    .set(
      {
        uid: userRecord.uid,
        email,
        displayName: fullName,
        role: staffRole,
        permissions,
        temporaryPassword,
        temporaryPasswordIssued: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  return {
    created,
    data: {
      ...accountPayload,
      temporaryPassword,
    },
  };
}

export async function updateStaff(
  user: DecodedIdToken,
  uid: string,
  body: {
    displayName?: string;
    staffRole?: StaffRoleInput;
    operations?: string[];
  },
) {
  const manager = await ensureBrandManager(user);

  const displayName = body.displayName?.trim();
  const staffRole = normalizeStaffRole(body.staffRole);

  if (!displayName || !staffRole) {
    throw new StaffServiceError("Họ tên và vai trò là bắt buộc.");
  }

  const permissions = resolvePermissions(staffRole, body.operations);
  const defaultRoute = resolveDefaultRoute(staffRole, permissions);

  const staffProfile = await getUserProfile(uid);

  if (!staffProfile || !belongsToManagerBrand(staffProfile, manager) || !isStaffAccount(staffProfile, manager)) {
    throw new StaffServiceError("Không tìm thấy nhân viên thuộc brand của bạn.", 404);
  }

  await authAdmin.updateUser(uid, { displayName });
  const userRecord = await authAdmin.getUser(uid);
  await authAdmin.setCustomUserClaims(uid, {
    ...(userRecord.customClaims || {}),
    role: staffRole,
    brandId: manager.brandId,
    brandName: manager.brandName,
    permissions,
    defaultRoute,
  });

  const payload = {
    displayName,
    role: staffRole,
    permissions,
    defaultRoute,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection("users").doc(uid).set(payload, { merge: true });
  await db.collection("brands").doc(manager.brandId).collection("staff").doc(uid).set(payload, { merge: true });

  const updatedDoc = await db.collection("users").doc(uid).get();
  return serializeStaffAccount(updatedDoc.data(), manager);
}

export async function updateStaffStatus(user: DecodedIdToken, uid: string, disabled: boolean) {
  const manager = await ensureBrandManager(user);

  const staffProfile = await getUserProfile(uid);

  if (!staffProfile || !belongsToManagerBrand(staffProfile, manager) || !isStaffAccount(staffProfile, manager)) {
    throw new StaffServiceError("Không tìm thấy nhân viên thuộc brand của bạn.", 404);
  }

  await authAdmin.updateUser(uid, { disabled });
  await db.collection("users").doc(uid).set(
    {
      disabled,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  await db
    .collection("brands")
    .doc(manager.brandId)
    .collection("staff")
    .doc(uid)
    .set(
      {
        disabled,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  const updatedDoc = await db.collection("users").doc(uid).get();
  return serializeStaffAccount(updatedDoc.data(), manager);
}

export async function revealTemporaryPassword(user: DecodedIdToken, uid: string) {
  const manager = await ensureBrandManager(user);

  const authTime = user.auth_time;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (!authTime || nowInSeconds - authTime > 300) {
    throw new StaffServiceError("Vui lòng xác thực lại trước khi xem mật khẩu tạm thời.", 403);
  }

  const staffProfile = await getUserProfile(uid);

  if (!staffProfile || !belongsToManagerBrand(staffProfile, manager) || !isStaffAccount(staffProfile, manager)) {
    throw new StaffServiceError("Không tìm thấy nhân viên thuộc brand của bạn.", 404);
  }

  if (staffProfile.temporaryPasswordIssued !== true || !staffProfile.temporaryPassword) {
    throw new StaffServiceError("Mật khẩu tạm thời không còn khả dụng cho tài khoản này.");
  }

  return {
    uid,
    temporaryPassword: staffProfile.temporaryPassword as string,
  };
}

export async function resetTemporaryPassword(user: DecodedIdToken, uid: string) {
  const manager = await ensureBrandManager(user);

  const authTime = user.auth_time;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (!authTime || nowInSeconds - authTime > 300) {
    throw new StaffServiceError("Vui lòng xác thực lại trước khi cấp lại mật khẩu tạm thời.", 403);
  }

  const staffProfile = await getUserProfile(uid);

  if (!staffProfile || !belongsToManagerBrand(staffProfile, manager) || !isStaffAccount(staffProfile, manager)) {
    throw new StaffServiceError("Không tìm thấy nhân viên thuộc brand của bạn.", 404);
  }

  const temporaryPassword = generateTemporaryPassword();
  await authAdmin.updateUser(uid, {
    password: temporaryPassword,
    disabled: false,
  });

  const userRecord = await authAdmin.getUser(uid);
  await authAdmin.setCustomUserClaims(uid, {
    ...(userRecord.customClaims || {}),
    temporaryPasswordIssued: true,
  });

  await db.collection("users").doc(uid).set(
    {
      temporaryPassword,
      temporaryPasswordIssued: true,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await db
    .collection("brands")
    .doc(manager.brandId)
    .collection("staff")
    .doc(uid)
    .set(
      {
        temporaryPassword,
        temporaryPasswordIssued: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  return { uid, temporaryPassword };
}
