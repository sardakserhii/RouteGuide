import { FastifyInstance } from "fastify";
import { PoiController } from "../controllers/poiController";

export default async function poisRoutes(fastify: FastifyInstance) {
  const poiController = new PoiController();

  fastify.post("/", async (request, reply) => {
    return poiController.getPois(request as any, reply);
  });
}
