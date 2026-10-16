import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { createCircleSchema, joinCircleSchema, uuidSchema } from "@varaq/shared";
import { userId } from "../../plugins/auth";
import type { CirclesService } from "./circle.service";

export function circleRoutes(circles: CirclesService) {
  return async (app: FastifyInstance) => {
    const r = app.withTypeProvider<ZodTypeProvider>();
    const base = { onRequest: [app.authenticate] };
    const tags = ["circles"];
    const security = [{ bearerAuth: [] }];

    r.get("/circles/mine", { ...base, schema: { tags, security, summary: "Circles I belong to (with invite codes)" } }, (req) =>
      circles.listMine(userId(req)),
    );
    r.get(
      "/circles",
      { ...base, schema: { tags, security, summary: "Discover public circles", querystring: z.object({ city: z.string().optional() }) } },
      (req) => circles.discover(userId(req), req.query.city),
    );
    r.post(
      "/circles",
      {
        ...base,
        schema: { tags, security, summary: "Create a circle / hub (geohash is truncated to neighborhood level)", body: createCircleSchema },
      },
      async (req, reply) => reply.code(201).send(await circles.create(userId(req), req.body)),
    );
    r.post(
      "/circles/join",
      { ...base, schema: { tags, security, summary: "Join a circle by invite code or a public circle by id", body: joinCircleSchema } },
      async (req) => {
        const c = await circles.join(userId(req), req.body);
        return { id: c.id, name: c.name };
      },
    );
    r.delete(
      "/circles/:id/membership",
      { ...base, schema: { tags, security, summary: "Leave a circle", params: z.object({ id: uuidSchema }) } },
      async (req, reply) => {
        await circles.leave(userId(req), req.params.id);
        return reply.code(204).send();
      },
    );
  };
}
