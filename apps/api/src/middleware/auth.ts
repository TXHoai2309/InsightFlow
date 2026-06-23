// apps/api/src/middleware/auth.ts
import { FastifyReply, FastifyRequest } from "fastify";
import { getAuth } from "firebase-admin/auth";
import "./../services/firebase"; // Ensure firebase app is initialized

export async function verifyToken(request: FastifyRequest, reply: FastifyReply) {
  const token = request.headers.authorization?.split("Bearer ")[1];
  if (!token) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
  try {
    const decoded = await getAuth().verifyIdToken(token);
    (request as any).user = decoded;
  } catch (err) {
    return reply.status(401).send({ error: "Invalid token" });
  }
}