import { adminAuth } from "@/lib/firebaseAdmin";
import type { DecodedIdToken } from "firebase-admin/auth";
import { extractBearerToken } from "./bearer-token";

export async function verifyBearerToken(authorization: string | null): Promise<DecodedIdToken | null> {
  const token = extractBearerToken(authorization);

  if (!token) return null;

  try {
    return await adminAuth.verifyIdToken(token);
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
