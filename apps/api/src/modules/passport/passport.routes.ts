import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { passportEntrySchema, uuidSchema } from "@varaq/shared";
import { userId } from "../../plugins/auth";
import type { PassportService } from "./passport.service";

export function passportRoutes(passport: PassportService) {
  return async (app: FastifyInstance) => {
    const r = app.withTypeProvider<ZodTypeProvider>();
    const base = { onRequest: [app.authenticate] };
    const tags = ["passport"];
    const security = [{ bearerAuth: [] }];

    r.get(
      "/copies/:id/passport",
      {
        ...base,
        schema: { tags, security, summary: "Book Passport: the journey of one physical copy", params: z.object({ id: uuidSchema }) },
      },
      (req) => passport.timeline(req.params.id),
    );
    r.post(
      "/copies/:id/passport",
      {
        ...base,
        schema: {
          tags,
          security,
          summary: "Leave a one-sentence memory after returning the book (borrower, once per loan)",
          params: z.object({ id: uuidSchema }),
          body: passportEntrySchema,
        },
      },
      async (req, reply) => reply.code(201).send(await passport.addEntry(userId(req), req.params.id, req.body)),
    );
    r.get(
      "/passport/pending",
      { ...base, schema: { tags, security, summary: "Returned loans where I have not left a passport note yet" } },
      (req) => passport.pendingNotes(userId(req)),
    );
  };
}
