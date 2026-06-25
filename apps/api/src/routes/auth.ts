import { FastifyInstance } from "fastify";
import { authAdmin } from "../services/firebase";

export default async function authRoutes(fastify: FastifyInstance) {
  
  // Route to update password via Admin SDK
  fastify.post("/reset-password", async (request, reply) => {
    const { email, newPassword } = request.body as { email: string; newPassword: string };

    if (!email || !newPassword) {
      return reply.status(400).send({ error: "Email and newPassword are required." });
    }

    try {
      // 1. Find user by email
      const userRecord = await authAdmin.getUserByEmail(email);
      
      // 2. Update password
      await authAdmin.updateUser(userRecord.uid, {
        password: newPassword,
      });

      return reply.status(200).send({ message: "Password updated successfully." });
    } catch (error: any) {
      console.error("[AuthRoute] Reset Password Error:", error);
      return reply.status(500).send({ 
        error: error.code === "auth/user-not-found" 
          ? "User not found." 
          : "Failed to update password." 
      });
    }
  });
}
