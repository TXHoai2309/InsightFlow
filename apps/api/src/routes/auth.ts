// apps/api/src/routes/auth.ts
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { authAdmin, db } from "../services/firebase";
import { verifyToken } from "../middleware/auth";

export default async function authRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  // Route to generate password reset link using Firebase Admin SDK
  fastify.post("/reset-link", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email } = request.body as { email: string };
      if (!email) {
        return reply.status(400).send({ success: false, error: "Email is required" });
      }

      // Generate password reset link using Firebase Admin SDK
      const auth = getAuth();
      const link = await auth.generatePasswordResetLink(email.trim());

      return { success: true, link };
    } catch (error: any) {
      // Catch specific Firebase Auth errors
      if (error.code === "auth/user-not-found" || error.message?.includes("user-not-found")) {
        return reply.status(404).send({ success: false, error: "auth/user-not-found" });
      }
      if (error.code === "auth/invalid-email" || error.message?.includes("invalid-email")) {
        return reply.status(400).send({ success: false, error: "auth/invalid-email" });
      }

      request.log.error(error);
      return reply.status(500).send({ success: false, error: error.message || "Internal server error" });
    }
  });

  // Route to update password via Admin SDK directly
  fastify.post("/reset-password", async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, newPassword } = request.body as { email: string; newPassword: string };

    if (!email || !newPassword) {
      return reply.status(400).send({ success: false, error: "Email and newPassword are required." });
    }

    try {
      console.log(`[AuthRoute] Resetting password for: ${email}`);
      // 1. Find user by email
      const userRecord = await authAdmin.getUserByEmail(email.trim());
      console.log(`[AuthRoute] User found: ${userRecord.uid}`);
      
      // 2. Update password
      await authAdmin.updateUser(userRecord.uid, {
        password: newPassword,
      });
      console.log(`[AuthRoute] Password updated for: ${userRecord.uid}`);

      return reply.status(200).send({ success: true, message: "Password updated successfully." });
    } catch (error: any) {
      console.error("[AuthRoute] Reset Password Detailed Error:", error);
      if (error.code === "auth/user-not-found" || error.message?.includes("user-not-found")) {
        return reply.status(404).send({ success: false, error: "User not found." });
      }
      return reply.status(500).send({ 
        success: false, 
        error: "Failed to update password: " + error.message
      });
    }
  });

  fastify.post("/complete-first-password-change", async (request: FastifyRequest, reply: FastifyReply) => {
    await verifyToken(request, reply);
    if (reply.sent) return;

    const requester = (request as any).user;

    try {
      const userRef = db.collection("users").doc(requester.uid);
      const snapshot = await userRef.get();
      const profile = snapshot.exists ? snapshot.data() : null;

      await userRef.set(
        {
          temporaryPasswordIssued: false,
          temporaryPassword: FieldValue.delete(),
          passwordChangedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      if (profile?.brandId && ["crisis_staff", "lead_staff"].includes(profile.role)) {
        await db
          .collection("brands")
          .doc(profile.brandId)
          .collection("staff")
          .doc(requester.uid)
          .set(
            {
              temporaryPasswordIssued: false,
              temporaryPassword: FieldValue.delete(),
              passwordChangedAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
      }

      const userRecord = await authAdmin.getUser(requester.uid);
      await authAdmin.setCustomUserClaims(requester.uid, {
        ...(userRecord.customClaims || {}),
        temporaryPasswordIssued: false,
      });

      return { success: true };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to complete first password change.",
      });
    }
  });
}
