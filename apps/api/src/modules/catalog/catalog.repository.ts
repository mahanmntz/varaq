import { Prisma, type BookCondition, type CopyStatus } from "@prisma/client";
import { buildSearchText } from "@varaq/shared";
import type { Db, Tx } from "../../lib/db";

export type EditionInput = {
  isbn?: string | null;
  title: string;
  authors: string[];
  publisher?: string | null;
  genres?: string[];
  coverUrl?: string | null;
};

const copyInclude = {
  edition: true,
  owner: { select: { id: true, username: true, firstName: true, avatarId: true, trustScore: true, karmaTokens: true } },
} satisfies Prisma.BookCopyInclude;
export type CopyRow = Prisma.BookCopyGetPayload<{ include: typeof copyInclude }>;

export type AvailableFilter = {
  excludeOwnerId?: string;
  ownerIds?: string[];
  editionIds?: string[];
  genre?: string;
  condition?: BookCondition;
};
function availableWhere(f: AvailableFilter): Prisma.BookCopyWhereInput {
  return {
    status: "AVAILABLE",
    ownerId: { ...(f.excludeOwnerId ? { not: f.excludeOwnerId } : {}), ...(f.ownerIds ? { in: f.ownerIds } : {}) },
    ...(f.editionIds ? { editionId: { in: f.editionIds } } : {}),
    ...(f.condition ? { condition: f.condition } : {}),
    ...(f.genre ? { edition: { genres: { has: f.genre } } } : {}),
  };
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, "\\$&");

export function createCatalogRepository(db: Db) {
  const c = (tx?: Tx) => tx ?? db;
  return {
    findEditionByIsbn: (isbn: string) => db.bookEdition.findUnique({ where: { isbn } }),

    createEdition: (e: EditionInput) =>
      db.bookEdition.create({
        data: {
          isbn: e.isbn ?? null,
          title: e.title,
          authors: e.authors,
          publisher: e.publisher ?? null,
          genres: e.genres ?? [],
          coverUrl: e.coverUrl ?? null,
          searchText: buildSearchText(e),
        },
      }),

    /**
     * Typo-tolerant search: trigram word-similarity, substring match and FTS over the
     * normalized `search_text` column. Returns edition ids ranked best-first.
     */
    async searchEditionIds(normalizedQuery: string, limit: number): Promise<string[]> {
      const like = `%${escapeLike(normalizedQuery)}%`;
      const [, rows] = await db.$transaction([
        db.$executeRaw`SET LOCAL pg_trgm.word_similarity_threshold = 0.4`,
        db.$queryRaw<{ id: string }[]>`
          SELECT id FROM book_editions
          WHERE ${normalizedQuery} <% search_text
             OR search_text ILIKE ${like}
             OR search_vector @@ plainto_tsquery('simple', ${normalizedQuery})
          ORDER BY (search_text ILIKE ${like}) DESC,
                   word_similarity(${normalizedQuery}, search_text) DESC
          LIMIT ${limit}`,
      ]);
      return rows.map((r) => r.id);
    },

    createCopy: (data: { ownerId: string; editionId: string; condition: BookCondition; status: CopyStatus; ownerNotes?: string }) =>
      db.bookCopy.create({ data, include: copyInclude }),
    findCopy: (id: string, tx?: Tx) => c(tx).bookCopy.findUnique({ where: { id }, include: copyInclude }),
    listByOwner: (ownerId: string) => db.bookCopy.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" }, include: copyInclude }),
    countOwnerAvailable: (ownerId: string) => db.bookCopy.count({ where: { ownerId, status: "AVAILABLE" } }),
    updateCopy: (id: string, data: Prisma.BookCopyUpdateInput, tx?: Tx) =>
      c(tx).bookCopy.update({ where: { id }, data, include: copyInclude }),
    deleteCopy: (id: string) => db.bookCopy.delete({ where: { id } }),

    /** Available copies from anyone except `excludeOwnerId`, with optional filters. */
    findAvailable: (args: AvailableFilter & { take?: number; skip?: number }) =>
      db.bookCopy.findMany({
        where: availableWhere(args),
        orderBy: { createdAt: "desc" },
        take: args.take,
        skip: args.skip,
        include: copyInclude,
      }),
    countAvailable: (excludeOwnerId?: string) => db.bookCopy.count({ where: availableWhere({ excludeOwnerId }) }),
    /** One random available copy (not mine). */
    async randomAvailable(excludeOwnerId: string) {
      const where = availableWhere({ excludeOwnerId });
      const total = await db.bookCopy.count({ where });
      if (!total) return null;
      return db.bookCopy.findFirst({ where, skip: Math.floor(Math.random() * total), orderBy: { id: "asc" }, include: copyInclude });
    },

    // --- wishlist ---
    wishlistEditionIds: async (userId: string) =>
      (await db.wishlistItem.findMany({ where: { userId }, select: { editionId: true } })).map((w) => w.editionId),
    addWishlist: (userId: string, editionId: string) =>
      db.wishlistItem.upsert({ where: { userId_editionId: { userId, editionId } }, update: {}, create: { userId, editionId } }),
    removeWishlist: (userId: string, editionId: string) => db.wishlistItem.deleteMany({ where: { userId, editionId } }),
    wishlistEditions: (userId: string) =>
      db.wishlistItem.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { edition: true } }),
    findEdition: (id: string) => db.bookEdition.findUnique({ where: { id } }),
  };
}
export type CatalogRepository = ReturnType<typeof createCatalogRepository>;
