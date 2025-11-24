import Fastify from "fastify";
import cors from "@fastify/cors";
import routeRoutes from "./routes/routeRoutes.js";
import poisRoutes from "./routes/poisRoutes.js";
import "./db/database.js"; // Initialize database on startup

const server = Fastify({
  logger: true,
});

server.register(cors, {
  origin: "*", // Allow all origins for now, can be restricted later
});

server.get("/", async (request, reply) => {
  return { hello: "world" };
});

server.register(routeRoutes, { prefix: "/api/route" });
server.register(poisRoutes, { prefix: "/api/pois" });

const start = async () => {
  try {
    await server.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Server listening on http://localhost:3000");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
