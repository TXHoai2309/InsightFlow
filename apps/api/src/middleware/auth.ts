// apps/api/src/middleware/auth.ts
import { FastifyReply, FastifyRequest } from "fastify";
import { getAuth } from "firebase-admin/auth";
import "./../services/firebase"; // Ensure firebase app is initialized

export async function verifyToken(request: FastifyRequest, reply: FastifyReply) {
  const authorization = request.headers.authorization;
  const token =
    typeof authorization === "string"
      ? authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
      : undefined;

  if (!token) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
  try {
    const decoded = await getAuth().verifyIdToken(token);
    (request as any).user = decoded;
  } catch (err: any) {
    request.log.warn(
      {
        code: err?.code,
        message: err?.message,
      },
      "[Auth] Firebase ID token verification failed",
    );
    return reply.status(401).send({ error: "Invalid token" });
  }
}
