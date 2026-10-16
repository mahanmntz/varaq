import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { createCopySchema, feedQuerySchema, isbnSchema, updateCopySchema, uuidSchema } from "@varaq/shared";
import { userId } from "../../plugins/auth";
import type { CatalogService } from "./catalog.service";

export function catalogRoutes(catalog: CatalogService) {
  return async (app: FastifyInstance) => {
    const r = app.withTypeProvider<ZodTypeProvider>();
    const base = { onRequest: [app.authenticate] };
    const tags = ["catalog"];
    const security = [{ bearerAuth: [] }];
    const idParams = z.object({ id: uuidSchema });

    r.get(
      "/feed",
      {
        ...base,
        schema: {
          tags,
          security,
          summary:
            "Global feed of ALL available books (no circle required). Optional filters: circleId, nearby, genre, condition; `q` does typo-tolerant search over title, author, publisher and ISBN.",
          querystring: feedQuerySchema,
        },
      },
      (req) => catalog.feed(userId(req), req.query),
    );

    r.get("/feed/random", { ...base, schema: { tags, security, summary: "A random available book (Surprise Me)" } }, (req) =>
      catalog.random(userId(req)),
    );

    r.get("/wishlist", { ...base, schema: { tags, security, summary: "My wishlist with an available copy for each book" } }, (req) =>
      catalog.wishlist(userId(req)),
    );
    r.get("/wishlist/ids", { ...base, schema: { tags, security, summary: "Edition ids on my wishlist" } }, async (req) => ({
      editionIds: await catalog.wishlistIds(userId(req)),
    }));
    r.put(
      "/wishlist/:id",
      { ...base, schema: { tags, security, summary: "Bookmark a book edition", params: idParams } },
      async (req, reply) => {
        await catalog.addToWishlist(userId(req), req.params.id);
        return reply.code(204).send();
      },
    );
    r.delete(
      "/wishlist/:id",
      { ...base, schema: { tags, security, summary: "Remove a bookmark", params: idParams } },
      async (req, reply) => {
        await catalog.removeFromWishlist(userId(req), req.params.id);
        return reply.code(204).send();
      },
    );

    r.get(
      "/books/isbn/:isbn",
      {
        ...base,
        schema: {
          tags,
          security,
          summary: "Barcode lookup: local catalog, then Open Library / Google Books",
          params: z.object({ isbn: isbnSchema }),
        },
      },
      (req) => catalog.lookupIsbn(req.params.isbn),
    );

    r.post(
      "/copies",
      { ...base, schema: { tags, security, summary: "Add a physical book to my shelf (by ISBN or manual entry)", body: createCopySchema } },
      async (req, reply) => reply.code(201).send(await catalog.addCopy(userId(req), req.body)),
    );
    r.get("/copies/mine", { ...base, schema: { tags, security, summary: "My bookshelf" } }, (req) => catalog.listMine(userId(req)));
    r.get("/copies/:id", { ...base, schema: { tags, security, summary: "A single book copy", params: idParams } }, (req) =>
      catalog.getCopy(req.params.id),
    );
    r.patch(
      "/copies/:id",
      {
        ...base,
        schema: {
          tags,
          security,
          summary: "Update condition, availability or notes (owner only)",
          params: idParams,
          body: updateCopySchema,
        },
      },
      (req) => catalog.updateCopy(userId(req), req.params.id, req.body),
    );
    r.delete(
      "/copies/:id",
      { ...base, schema: { tags, security, summary: "Remove a copy that has no history (owner only)", params: idParams } },
      async (req, reply) => {
        await catalog.deleteCopy(userId(req), req.params.id);
        return reply.code(204).send();
      },
    );
  };
}
