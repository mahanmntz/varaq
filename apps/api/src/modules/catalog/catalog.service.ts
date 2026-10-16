import type { BookCondition, CopyStatus } from "@prisma/client";
import { normalizeIsbn, normalizePersian } from "@varaq/shared";
import type { Tx } from "../../lib/db";
import { isForeignKeyViolation } from "../../lib/db";
import { conflict, forbidden, notFound } from "../../lib/errors";
import type { CirclesService } from "../circles";
import type { UsersService } from "../users";
import type { CatalogRepository, CopyRow, EditionInput } from "./catalog.repository";
import type { MetadataProvider } from "./metadata.provider";

export const toCopyDto = (c: CopyRow, sharedCircles: string[] = []) => ({
  id: c.id,
  status: c.status,
  condition: c.condition,
  ownerNotes: c.ownerNotes,
  createdAt: c.createdAt,
  sharedCircles,
  owner: c.owner,
  edition: {
    id: c.edition.id,
    isbn: c.edition.isbn,
    title: c.edition.title,
    authors: c.edition.authors,
    publisher: c.edition.publisher,
    genres: c.edition.genres,
    coverUrl: c.edition.coverUrl,
  },
});
export type CopyDto = ReturnType<typeof toCopyDto>;

/** Public interface of the catalog module. */
export type CatalogService = ReturnType<typeof createCatalogService>;

export function createCatalogService(deps: {
  repo: CatalogRepository;
  metadata: MetadataProvider;
  users: UsersService;
  circles: CirclesService;
}) {
  const { repo, metadata, users, circles } = deps;

  async function resolveEdition(input: { isbn?: string; manual?: Omit<EditionInput, "isbn"> & { isbn?: string } }) {
    const isbn = input.isbn ?? input.manual?.isbn;
    if (isbn) {
      const local = await repo.findEditionByIsbn(isbn);
      if (local) return local;
    }
    if (input.manual) return repo.createEdition({ ...input.manual, isbn });
    const remote = await metadata.lookup(isbn!);
    if (!remote) throw notFound("BOOK_NOT_FOUND");
    return repo.createEdition(remote);
  }

  return {
    /** Barcode lookup: local catalog first, then external metadata. Does not persist. */
    async lookupIsbn(rawIsbn: string) {
      const isbn = normalizeIsbn(rawIsbn);
      const local = await repo.findEditionByIsbn(isbn);
      if (local)
        return {
          source: "local" as const,
          isbn,
          title: local.title,
          authors: local.authors,
          publisher: local.publisher,
          genres: local.genres,
          coverUrl: local.coverUrl,
        };
      const remote = await metadata.lookup(isbn);
      if (!remote) throw notFound("BOOK_NOT_FOUND");
      return { source: "external" as const, ...remote };
    },

    async addCopy(
      ownerId: string,
      input: { isbn?: string; manual?: any; condition: BookCondition; status: "AVAILABLE" | "UNAVAILABLE"; ownerNotes?: string },
    ) {
      await users.assertVerified(ownerId);
      const edition = await resolveEdition(input);
      const copy = await repo.createCopy({
        ownerId,
        editionId: edition.id,
        condition: input.condition,
        status: input.status,
        ownerNotes: input.ownerNotes,
      });
      await users.onAvailableCountChanged(ownerId, await repo.countOwnerAvailable(ownerId));
      return toCopyDto(copy);
    },

    async getCopy(id: string) {
      const copy = await repo.findCopy(id);
      if (!copy) throw notFound("COPY_NOT_FOUND");
      return toCopyDto(copy);
    },
    async listMine(ownerId: string) {
      return (await repo.listByOwner(ownerId)).map((c) => toCopyDto(c));
    },

    async updateCopy(
      ownerId: string,
      id: string,
      patch: { condition?: BookCondition; status?: "AVAILABLE" | "UNAVAILABLE"; ownerNotes?: string | null },
    ) {
      const copy = await repo.findCopy(id);
      if (!copy) throw notFound("COPY_NOT_FOUND");
      if (copy.ownerId !== ownerId) throw forbidden("NOT_COPY_OWNER");
      if (patch.status && (copy.status === "LOANED_INTERNAL" || copy.status === "LOANED_EXTERNAL")) throw conflict("COPY_IS_LOANED");
      const updated = await repo.updateCopy(id, patch);
      await users.onAvailableCountChanged(ownerId, await repo.countOwnerAvailable(ownerId));
      return toCopyDto(updated);
    },

    async deleteCopy(ownerId: string, id: string) {
      const copy = await repo.findCopy(id);
      if (!copy) throw notFound("COPY_NOT_FOUND");
      if (copy.ownerId !== ownerId) throw forbidden("NOT_COPY_OWNER");
      if (copy.status === "LOANED_INTERNAL" || copy.status === "LOANED_EXTERNAL") throw conflict("COPY_IS_LOANED");
      try {
        await repo.deleteCopy(id);
      } catch (err) {
        // Copies with loan / passport history are kept; the owner can mark them unavailable instead.
        if (isForeignKeyViolation(err)) throw conflict("COPY_HAS_HISTORY");
        throw err;
      }
    },

    /**
     * Global feed: ALL available copies on the platform (except the viewer's own).
     * Circle / "nearby" / genre / condition are optional filters, never a gate.
     */
    async feed(
      viewerId: string,
      q: {
        q?: string;
        circleId?: string;
        nearby?: boolean;
        genre?: string;
        condition?: BookCondition;
        sort?: "new" | "relevance";
        limit: number;
        offset: number;
      },
    ) {
      let ownerIds: string[] | undefined;
      if (q.circleId) ownerIds = await circles.visibleOwnerIds(viewerId, q.circleId, true);
      else if (q.nearby) ownerIds = await circles.visibleOwnerIds(viewerId);
      if (ownerIds && !ownerIds.length) return [];

      const base = { excludeOwnerId: viewerId, ownerIds, genre: q.genre, condition: q.condition };
      const nq = q.q ? normalizePersian(q.q) : "";
      let rows: CopyRow[];
      if (nq) {
        const editionIds = await repo.searchEditionIds(nq, 100);
        const rank = new Map(editionIds.map((id, i) => [id, i]));
        rows = (await repo.findAvailable({ ...base, editionIds }))
          .sort((a, b) => rank.get(a.editionId)! - rank.get(b.editionId)!)
          .slice(q.offset, q.offset + q.limit);
      } else {
        rows = await repo.findAvailable({ ...base, take: q.limit, skip: q.offset });
      }
      const shared = await circles.sharedCirclesByOwner(viewerId, [...new Set(rows.map((r) => r.ownerId))]);
      return rows.map((r) => toCopyDto(r, shared.get(r.ownerId) ?? []));
    },

    async random(viewerId: string) {
      const copy = await repo.randomAvailable(viewerId);
      if (!copy) throw notFound("NO_BOOKS_AVAILABLE");
      return toCopyDto(copy);
    },
    availableCount: () => repo.countAvailable(),
    async recentlyAdded(limit: number) {
      return (await repo.findAvailable({ take: limit })).map((c) => ({
        title: c.edition.title,
        owner: c.owner.firstName ?? c.owner.username,
        at: c.createdAt,
      }));
    },

    // --- wishlist (per edition) ---
    wishlistIds: (userId: string) => repo.wishlistEditionIds(userId),
    async addToWishlist(userId: string, editionId: string) {
      if (!(await repo.findEdition(editionId))) throw notFound("BOOK_NOT_FOUND");
      await repo.addWishlist(userId, editionId);
    },
    removeFromWishlist: (userId: string, editionId: string) => repo.removeWishlist(userId, editionId),
    /** Wishlisted editions, each with one currently available copy (if any). */
    async wishlist(userId: string) {
      const items = await repo.wishlistEditions(userId);
      return Promise.all(
        items.map(async (w) => {
          const [copy] = await repo.findAvailable({ excludeOwnerId: userId, editionIds: [w.editionId], take: 1 });
          return {
            edition: {
              id: w.edition.id,
              isbn: w.edition.isbn,
              title: w.edition.title,
              authors: w.edition.authors,
              publisher: w.edition.publisher,
              genres: w.edition.genres,
              coverUrl: w.edition.coverUrl,
            },
            availableCopy: copy ? toCopyDto(copy) : null,
          };
        }),
      );
    },

    // --- Cross-module API used by circulation ---
    async getCopyOrThrow(id: string, tx?: Tx) {
      const copy = await repo.findCopy(id, tx);
      if (!copy) throw notFound("COPY_NOT_FOUND");
      return copy;
    },
    async setCopyState(id: string, patch: { status?: CopyStatus; condition?: BookCondition }, tx?: Tx) {
      await repo.updateCopy(id, patch, tx);
    },
  };
}
