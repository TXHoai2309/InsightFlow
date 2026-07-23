import { adminAuth } from "@/lib/firebaseAdmin";
import type { DecodedIdToken } from "firebase-admin/auth";
import { extractBearerToken } from "./bearer-token";

export async function verifyBearerToken(
  authorization: string | null,
  options: { allowExpiredTrial?: boolean } = {},
): Promise<DecodedIdToken | null> {
  const token = extractBearerToken(authorization);

  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.trialAccount === true && !options.allowExpiredTrial) {
      const trialEndsAt = typeof decoded.trialEndsAt === "string"
        ? new Date(decoded.trialEndsAt)
        : null;
      if (!trialEndsAt || Number.isNaN(trialEndsAt.getTime()) || trialEndsAt.getTime() <= Date.now()) {
        return null;
      }
    }
    return decoded;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const authError = error as { code?: string; message?: string };
      console.error("[Auth] verifyIdToken failed", {
        code: authError.code || "unknown",
        message: authError.message || "Unknown Firebase Admin error",
      });
    }

    return null;
  }
}
