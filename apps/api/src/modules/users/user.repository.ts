import type { Db, Tx } from "../../lib/db";

export type CreateUserData = {
  username: string;
  contactHash: string;
  avatarId: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

export function createUserRepository(db: Db) {
  const c = (tx?: Tx) => tx ?? db;
  return {
    findById: (id: string, tx?: Tx) => c(tx).user.findUnique({ where: { id } }),
    findByPhoneNumber: (phoneNumber: string) => db.user.findUnique({ where: { phoneNumber } }),
    setContactHash: (id: string, contactHash: string) => db.user.update({ where: { id }, data: { contactHash } }),
    findByContactHash: (contactHash: string) => db.user.findUnique({ where: { contactHash } }),
    /** Highest trust first; used to fill the "high-trust lenders" banner. */
    topByTrust: (limit: number) =>
      db.user.findMany({ where: { status: "ACTIVE" }, orderBy: [{ trustScore: "desc" }, { karmaTokens: "desc" }], take: limit }),
    count: () => db.user.count(),
    findByUsername: (username: string) => db.user.findUnique({ where: { username } }),
    create: (data: CreateUserData) => db.user.create({ data }),
    completeIdentity: (id: string, data: { nationalId: string; birthDate: string }) => db.user.update({ where: { id }, data }),
    update: (id: string, data: { username?: string; avatarId?: number }) => db.user.update({ where: { id }, data }),

    /** Atomically adds `delta` tokens; returns false if it would drop the balance below zero. */
    async adjustTokens(id: string, delta: number, tx?: Tx): Promise<boolean> {
      const res = await c(tx).user.updateMany({
        where: { id, ...(delta < 0 ? { karmaTokens: { gte: -delta } } : {}) },
        data: { karmaTokens: { increment: delta } },
      });
      return res.count === 1;
    },
    async adjustTrust(id: string, delta: number, tx?: Tx) {
      const user = await c(tx).user.findUniqueOrThrow({ where: { id }, select: { trustScore: true } });
      const next = Math.max(0, Math.min(100, user.trustScore + delta));
      await c(tx).user.update({ where: { id }, data: { trustScore: next, status: next < 30 ? "RESTRICTED" : "ACTIVE" } });
    },
    /** Grants the one-time listing bonus; the flag makes it race-safe. */
    async grantListingBonus(id: string): Promise<boolean> {
      const res = await db.user.updateMany({
        where: { id, listingBonusGranted: false },
        data: { listingBonusGranted: true, karmaTokens: { increment: 1 } },
      });
      return res.count === 1;
    },
  };
}
export type UserRepository = ReturnType<typeof createUserRepository>;
