import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { verifyToken } from "../middleware/auth";
import { db } from "../services/firebase";
import {
  getCustomerInteractionHistory,
  type InteractionSourceType,
} from "../services/customer_interaction_service";

type HistoryQuery = {
  sourceType?: string;
  sourceId?: string;
  cursor?: string;
  limit?: string;
};

function normalizeRole(value: unknown) {
  if (value === "crisis_staff") return "crisis_employee";
  if (value === "lead_staff") return "lead_employee";
  return String(value || "");
}

function canUseSource(role: string, sourceType: InteractionSourceType) {
  if (role === "brand_manager") return true;
  if (sourceType === "alert") return role === "crisis_employee";
  return role === "lead_employee";
}

export default async function customerInteractionRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  fastify.get("/history", async (request: FastifyRequest, reply: FastifyReply) => {
    await verifyToken(request, reply);
    if (reply.sent) return;

    const query = request.query as HistoryQuery;
    const sourceType = query.sourceType as InteractionSourceType;
    const sourceId = String(query.sourceId || "").trim();
    if (!["alert", "lead"].includes(sourceType) || !sourceId) {
      return reply.status(400).send({
        success: false,
        code: "INVALID_REQUEST",
        error: "sourceType and sourceId are required.",
      });
    }

    const decoded = (request as any).user;
    const profileSnapshot = await db.collection("users").doc(decoded.uid).get();
    const profile = profileSnapshot.exists ? profileSnapshot.data() : null;
    if (!profile) {
      return reply.status(403).send({
        success: false,
        code: "ACCESS_DENIED",
        error: "User profile not found.",
      });
    }

    const role = normalizeRole(profile.role);
    if (!canUseSource(role, sourceType)) {
      return reply.status(403).send({
        success: false,
        code: "ACCESS_DENIED",
        error: "User is not allowed to view this interaction history.",
      });
    }
    if (!profile.brandId && !profile.brandName) {
      return reply.status(403).send({
        success: false,
        code: "ACCESS_DENIED",
        error: "User is not associated with a brand.",
      });
    }

    try {
      const data = await getCustomerInteractionHistory({
        sourceType,
        sourceId,
        cursor: query.cursor,
        limit: Number(query.limit || 20),
        requester: {
          uid: decoded.uid,
          role,
          brandId: String(profile.brandId || ""),
          brandName: String(profile.brandName || ""),
        },
      });
      if (!data) {
        return reply.status(404).send({
          success: false,
          code: "SOURCE_NOT_FOUND",
          error: "Interaction source not found.",
        });
      }
      return reply.send({ success: true, data });
    } catch (error: any) {
      const statusCode = Number(error?.statusCode || 500);
      request.log.error(
        { statusCode, code: error?.code, message: error?.message },
        "[CustomerInteractions] history query failed",
      );
      return reply.status(statusCode).send({
        success: false,
        code: statusCode === 403 ? "BRAND_SCOPE_MISMATCH" : "TEMPORARY_ERROR",
        error:
          statusCode === 403
            ? "Interaction source is outside the user's brand scope."
            : "Unable to load customer interaction history.",
      });
    }
  });
}
