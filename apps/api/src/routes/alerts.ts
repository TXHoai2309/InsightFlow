// apps/api/src/routes/alerts.ts
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { AlertService, AlertFilter } from "../services/alert_service";

export default async function alertsRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as any;

      const filters: AlertFilter = {
        brand: query.brand,
        severity: query.severity,
        source: query.source,
        status: query.status,
      };

      const limitVal = query.limit ? parseInt(query.limit, 10) : 50;

      const alerts = await AlertService.getAlerts(filters, limitVal);
      return { success: true, data: alerts };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });
}