import type { User } from "@prisma/client";
import { AVATAR_COUNT } from "@varaq/shared";
import type { Tx } from "../../lib/db";
import { isUniqueViolation, uniqueTarget } from "../../lib/db";
import { conflict, forbidden, notFound } from "../../lib/errors";
import type { CreateUserData, UserRepository } from "./user.repository";

/**
 * PRIVACY: other users see only first name, @username, avatar, trust score and karma tokens.
 * Last name, national code, phone and birth date stay private. Public DTOs are built
 * field-by-field so those columns can never leak by accident.
 */
export const toPublicUser = (u: Pick<User, "id" | "username" | "firstName" | "avatarId" | "trustScore" | "karmaTokens">) => ({
  id: u.id,
  firstName: u.firstName,
  username: u.username,
  avatarId: u.avatarId,
  trustScore: u.trustScore,
  karmaTokens: u.karmaTokens,
});

/** The signed-in user's own profile, including their private KYC details. */
export const toPrivateUser = (u: User) => ({
  ...toPublicUser(u),
  status: u.status,
  createdAt: u.createdAt,
  /** True once national code and birth date are on file; required to add books or borrow. */
  identityVerified: !!(u.nationalId && u.birthDate),
  identity: {
    firstName: u.firstName,
    lastName: u.lastName,
    nationalId: u.nationalId,
    phoneNumber: u.phoneNumber,
    birthDate: u.birthDate,
  },
});
export type PublicUser = ReturnType<typeof toPublicUser>;

/** Public interface of the users module; other modules depend only on this. */
export type UsersService = ReturnType<typeof createUserService>;

function assertVerified(user: Pick<User, "nationalId" | "birthDate">) {
  if (!user.nationalId || !user.birthDate) throw conflict("IDENTITY_REQUIRED");
}

export function createUserService(repo: UserRepository) {
  async function getOrThrow(id: string, tx?: Tx) {
    const user = await repo.findById(id, tx);
    if (!user) throw notFound("USER_NOT_FOUND");
    return user;
  }

  return {
    avatarIds: () => Array.from({ length: AVATAR_COUNT }, (_, i) => i + 1),
    getMe: async (id: string) => toPrivateUser(await getOrThrow(id)),
    getPublic: async (id: string) => toPublicUser(await getOrThrow(id)),
    getPublicMany: async (ids: string[]) => {
      const users = await Promise.all([...new Set(ids)].map((id) => repo.findById(id)));
      return new Map(users.filter((u): u is User => !!u).map((u) => [u.id, toPublicUser(u)]));
    },
    async topByTrust(limit: number) {
      return (await repo.topByTrust(limit)).map(toPublicUser);
    },
    countUsers: () => repo.count(),
    findByContactHash: (hash: string) => repo.findByContactHash(hash),
    /**
     * Finds the account for a verified phone. The phone number is the source of truth; the hash
     * is re-synced if it was computed with a different pepper (e.g. data seeded elsewhere).
     */
    async findByPhone(phone: string, hash: string) {
      const byHash = await repo.findByContactHash(hash);
      if (byHash) return byHash;
      const byPhone = await repo.findByPhoneNumber(phone);
      if (byPhone) return repo.setContactHash(byPhone.id, hash);
      return null;
    },

    async register(data: CreateUserData) {
      try {
        return await repo.create(data);
      } catch (err) {
        if (isUniqueViolation(err)) {
          const target = uniqueTarget(err);
          if (target.includes("national_id")) throw conflict("NATIONAL_ID_TAKEN");
          if (target.includes("username")) throw conflict("USERNAME_TAKEN");
          throw conflict("ACCOUNT_EXISTS");
        }
        throw err;
      }
    },
    /** Adds the national code and birth date after sign-up; required before borrowing. */
    async completeIdentity(id: string, data: { nationalId: string; birthDate: string }) {
      try {
        return toPrivateUser(await repo.completeIdentity(id, data));
      } catch (err) {
        if (isUniqueViolation(err)) throw conflict("NATIONAL_ID_TAKEN");
        throw err;
      }
    },
    async updateProfile(id: string, data: { username?: string; avatarId?: number }) {
      try {
        return toPrivateUser(await repo.update(id, data));
      } catch (err) {
        if (isUniqueViolation(err)) throw conflict("USERNAME_TAKEN");
        throw err;
      }
    },

    /** Throws IDENTITY_REQUIRED until the user has completed identity verification. */
    async assertVerified(id: string) {
      assertVerified(await getOrThrow(id));
    },
    /** Throws unless the user may borrow right now (not restricted, has a free token). */
    async assertCanBorrow(id: string, tx?: Tx) {
      const user = await getOrThrow(id, tx);
      if (user.status === "RESTRICTED") throw forbidden("USER_RESTRICTED");
      assertVerified(user);
      if (user.karmaTokens < 1) throw conflict("NO_TOKENS");
    },
    /** Returns false if the balance would go negative. */
    adjustTokens: (id: string, delta: number, tx?: Tx) => repo.adjustTokens(id, delta, tx),
    adjustTrust: (id: string, delta: number, tx?: Tx) => repo.adjustTrust(id, delta, tx),

    /** Called by catalog after the owner's available-book count changes. */
    async onAvailableCountChanged(ownerId: string, availableCount: number) {
      if (availableCount >= 2) await repo.grantListingBonus(ownerId);
    },
  };
}
