import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { validateStrongPassword } from "@/lib/passwordPolicy";
import { authAdmin, db } from "@/lib/server/firebaseAdmin";

type SupportedInitialPasswordRole =
  | "brand_manager"
  | "crisis_employee"
  | "lead_employee"
  | "crisis_staff"
  | "lead_staff";

export type InitialPasswordErrorCode =
  | "SESSION_NOT_RECENT"
  | "PROFILE_NOT_FOUND"
  | "PROFILE_INVALID"
  | "ACCOUNT_DISABLED"
  | "PASSWORD_POLICY_INVALID"
  | "CHANGE_FAILED"
  | "RECOVERY_REQUIRED";

export class InitialPasswordServiceError extends Error {
  code: InitialPasswordErrorCode;
  status: number;

  constructor(code: InitialPasswordErrorCode, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function isSupportedRole(role: unknown): role is SupportedInitialPasswordRole {
  return [
    "brand_manager",
    "crisis_employee",
    "lead_employee",
    "crisis_staff",
    "lead_staff",
  ].includes(String(role));
}

function isEmployeeRole(role: SupportedInitialPasswordRole) {
  return role !== "brand_manager";
}

function stripUndefinedFields(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );
}

function assertRecentAuthentication(user: DecodedIdToken) {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (!user.auth_time || nowInSeconds - user.auth_time > 5 * 60) {
    throw new InitialPasswordServiceError(
      "SESSION_NOT_RECENT",
      "Phiên xác thực đã hết hạn. Vui lòng đăng nhập lại bằng mật khẩu tạm thời.",
      403,
    );
  }
}

function assertPasswordPolicy(password: string) {
  const policy = validateStrongPassword(password);
  if (!policy.valid || password.length > 128) {
    throw new InitialPasswordServiceError(
      "PASSWORD_POLICY_INVALID",
      "Mật khẩu mới chưa đáp ứng chính sách bảo mật.",
    );
  }
}

export async function changeInitialPassword(
  user: DecodedIdToken,
  newPassword: string,
) {
  assertRecentAuthentication(user);
  assertPasswordPolicy(newPassword);

  const userRef = db.collection("users").doc(user.uid);
  const profileSnapshot = await userRef.get();
  if (!profileSnapshot.exists) {
    throw new InitialPasswordServiceError(
      "PROFILE_NOT_FOUND",
      "Không tìm thấy hồ sơ tài khoản. Vui lòng liên hệ quản lý.",
      404,
    );
  }

  const profile = profileSnapshot.data() || {};
  if (!isSupportedRole(profile.role)) {
    throw new InitialPasswordServiceError(
      "PROFILE_INVALID",
      "Vai trò tài khoản không hỗ trợ quy trình đổi mật khẩu lần đầu.",
      403,
    );
  }
  if (profile.disabled === true) {
    throw new InitialPasswordServiceError(
      "ACCOUNT_DISABLED",
      "Tài khoản đã bị khóa. Vui lòng liên hệ quản lý.",
      403,
    );
  }

  const defaultRoute = typeof profile.defaultRoute === "string"
    ? profile.defaultRoute
    : profile.role === "brand_manager"
      ? "/dashboard"
      : Array.isArray(profile.permissions) && profile.permissions.includes("alerts")
        ? "/alerts"
        : "/leads";

  if (profile.temporaryPasswordIssued !== true) {
    return { alreadyCompleted: true, defaultRoute };
  }

  const temporaryPassword = typeof profile.temporaryPassword === "string"
    ? profile.temporaryPassword
    : "";
  if (!temporaryPassword) {
    throw new InitialPasswordServiceError(
      "PROFILE_INVALID",
      "Hồ sơ không còn mật khẩu tạm để khôi phục an toàn. Vui lòng yêu cầu quản lý cấp lại mật khẩu tạm.",
      409,
    );
  }
  if (newPassword === temporaryPassword) {
    throw new InitialPasswordServiceError(
      "PASSWORD_POLICY_INVALID",
      "Mật khẩu mới phải khác mật khẩu tạm thời.",
    );
  }

  const brandId = typeof profile.brandId === "string" ? profile.brandId : "";
  if (isEmployeeRole(profile.role) && !brandId) {
    throw new InitialPasswordServiceError(
      "PROFILE_INVALID",
      "Tài khoản nhân viên chưa được gắn với thương hiệu. Vui lòng liên hệ quản lý.",
      409,
    );
  }

  const authRecord = await authAdmin.getUser(user.uid);
  const previousClaims = authRecord.customClaims || {};
  const nextClaims = stripUndefinedFields({
    ...previousClaims,
    role: profile.role,
    brandId: profile.brandId,
    brandName: profile.brandName,
    permissions: profile.permissions,
    defaultRoute,
    temporaryPasswordIssued: false,
  });

  let passwordChanged = false;
  try {
    await authAdmin.updateUser(user.uid, { password: newPassword });
    passwordChanged = true;
    await authAdmin.setCustomUserClaims(user.uid, nextClaims);

    const passwordChangePayload = {
      temporaryPasswordIssued: false,
      temporaryPassword: FieldValue.delete(),
      passwordChangedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    const batch = db.batch();
    batch.set(userRef, passwordChangePayload, { merge: true });

    if (isEmployeeRole(profile.role)) {
      const staffRef = db
        .collection("brands")
        .doc(brandId)
        .collection("staff")
        .doc(user.uid);
      batch.set(
        staffRef,
        {
          uid: user.uid,
          email: profile.email || authRecord.email || "",
          displayName: profile.displayName || authRecord.displayName || "",
          role: profile.role,
          permissions: Array.isArray(profile.permissions) ? profile.permissions : [],
          ...passwordChangePayload,
        },
        { merge: true },
      );
    }

    await batch.commit();
    return { alreadyCompleted: false, defaultRoute };
  } catch (error) {
    if (!passwordChanged) {
      console.error("[InitialPassword] Authentication update failed:", error);
      throw new InitialPasswordServiceError(
        "CHANGE_FAILED",
        "Không thể đổi mật khẩu lúc này. Vui lòng thử lại.",
        500,
      );
    }

    try {
      await authAdmin.updateUser(user.uid, { password: temporaryPassword });
      await authAdmin.setCustomUserClaims(user.uid, previousClaims);
    } catch (rollbackError) {
      console.error("[InitialPassword] Recovery failed:", rollbackError);
      throw new InitialPasswordServiceError(
        "RECOVERY_REQUIRED",
        "Mật khẩu đã thay đổi nhưng hồ sơ chưa đồng bộ. Vui lòng liên hệ quản lý để cấp lại mật khẩu tạm.",
        500,
      );
    }

    console.error("[InitialPassword] Profile update failed; authentication was restored:", error);
    throw new InitialPasswordServiceError(
      "CHANGE_FAILED",
      "Không thể đồng bộ hồ sơ. Mật khẩu tạm vẫn còn hiệu lực, vui lòng thử lại.",
      500,
    );
  }
}
