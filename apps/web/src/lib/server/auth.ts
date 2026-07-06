import { authAdmin } from "./firebaseAdmin";
import type { DecodedIdToken } from "firebase-admin/auth";

export async function verifyBearerToken(authorization: string | null): Promise<DecodedIdToken | null> {
  const token =
    typeof authorization === "string"
      ? authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
      : undefined;

  if (!token) return null;

  try {
    return await authAdmin.verifyIdToken(token);
  } catch {
    return null;
  }
}
