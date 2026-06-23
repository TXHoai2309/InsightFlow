// apps/api/src/index.ts
import Fastify from "fastify";
import alertsRoutes from "./routes/alerts";

const fastify = Fastify({
  logger: true,
});

// Enable CORS
fastify.addHook("onRequest", async (request, reply) => {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (request.method === "OPTIONS") {
    return reply.status(200).send();
  }
});

// Register Alerts routes
fastify.register(alertsRoutes, { prefix: "/api/alerts" });

// Health check endpoint
fastify.get("/health", async () => {
  return { status: "OK", timestamp: new Date().toISOString() };
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const HOST = "0.0.0.0";

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`[API Server] Running at http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
