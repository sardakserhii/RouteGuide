import { FastifyInstance } from "fastify";
import { PoiController } from "../controllers/poiController";

export default async function poisRoutes(fastify: FastifyInstance) {
  const poiController = new PoiController();

  fastify.post("/", async (request, reply) => {
    try {
      const result = await poiController.getPois(request.body as any);
      return result;
    } catch (error: any) {
      request.log.error(error);
      if (error.message === "Missing or invalid bbox parameter") {
        return reply.code(400).send({ error: error.message });
      }
      return reply.code(500).send({ error: "Failed to fetch POIs" });
    }
  });
}
