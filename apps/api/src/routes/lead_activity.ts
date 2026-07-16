import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { verifyToken } from "../middleware/auth";
import { db } from "../services/firebase";
import { getLeadActivityHistory } from "../services/lead_activity_service";

type ActivityParams = { leadId?: string };
type ActivityQuery = { cursor?: string; limit?: string };

function normalizeRole(value: unknown) {
  if (value === "lead_staff") return "lead_employee";
  return String(value || "");
}

export default async function leadActivityRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  fastify.get("/:leadId/activity", async (request: FastifyRequest, reply: FastifyReply) => {
    await verifyToken(request, reply);
    if (reply.sent) return;

    const leadId = String((request.params as ActivityParams).leadId || "").trim();
    if (!leadId) {
      return reply.status(400).send({ success: false, code: "INVALID_REQUEST" });
    }

    const decoded = (request as any).user;
    const snapshot = await db.collection("users").doc(decoded.uid).get();
    const profile = snapshot.exists ? snapshot.data() : null;
    const role = normalizeRole(profile?.role);
    if (!profile || !["lead_employee", "brand_manager"].includes(role)) {
      return reply.status(403).send({ success: false, code: "ACCESS_DENIED" });
    }
    if (!profile.brandId && !profile.brandName) {
      return reply.status(403).send({ success: false, code: "ACCESS_DENIED" });
    }

    const query = request.query as ActivityQuery;
    try {
      const data = await getLeadActivityHistory({
        leadId,
        cursor: query.cursor,
        limit: Number(query.limit || 20),
        requester: {
          brandId: String(profile.brandId || ""),
          brandName: String(profile.brandName || ""),
        },
      });
      if (!data) {
        return reply.status(404).send({ success: false, code: "LEAD_NOT_FOUND" });
      }
      return reply.send({ success: true, data });
    } catch (error: any) {
      const statusCode = Number(error?.statusCode || 500);
      request.log.error(
        { statusCode, message: error?.message },
        "[LeadActivity] history query failed",
      );
      return reply.status(statusCode).send({
        success: false,
        code: statusCode === 403 ? "BRAND_SCOPE_MISMATCH" : "TEMPORARY_ERROR",
      });
    }
  });
}

