import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface RouteQuery {
  from: string; // "lat,lng"
  to: string;   // "lat,lng"
}

export default async function routeRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest<{ Querystring: RouteQuery }>, reply: FastifyReply) => {
    const { from, to } = request.query;

    if (!from || !to) {
      return reply.code(400).send({ error: 'Missing from or to parameters' });
    }

    const [fromLat, fromLng] = from.split(',');
    const [toLat, toLng] = to.split(',');

    if (!fromLat || !fromLng || !toLat || !toLng) {
        return reply.code(400).send({ error: 'Invalid coordinates format. Use lat,lng' });
    }

    // OSRM expects "lng,lat"
    const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

    try {
      const response = await fetch(osrmUrl);
      
      if (!response.ok) {
        fastify.log.error(`OSRM API error: ${response.status} ${response.statusText}`);
        return reply.code(502).send({ error: 'Failed to fetch route from OSRM' });
      }

      const data = await response.json();
      const route = data.routes?.[0];
      
      if (!route) {
          return reply.code(404).send({ error: 'No route found' });
      }

      return {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch route from OSRM' });
    }
  });
}
