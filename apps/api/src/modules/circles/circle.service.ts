import type { Circle } from "@prisma/client";
import { GEOHASH_MAX_PRECISION, fuzzGeohash } from "@varaq/shared";
import { randomCode } from "../../lib/hash";
import { forbidden, notFound } from "../../lib/errors";
import type { CircleRepository } from "./circle.repository";

type CircleWithCount = Circle & { _count: { members: number } };

const toDto = (c: CircleWithCount, isMember: boolean, includeInvite: boolean) => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  city: c.city,
  geohash: c.geohash,
  isPublic: c.isPublic,
  memberCount: c._count.members,
  isMember,
  ...(includeInvite && isMember ? { inviteCode: c.inviteCode } : {}),
});

export type CirclesService = ReturnType<typeof createCircleService>;

/** Latin slug when possible; Persian names fall back to a random suffix. */
function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "circle"}-${randomCode(5).toLowerCase()}`;
}

export function createCircleService(repo: CircleRepository) {
  async function join(userId: string, circle: Circle) {
    await repo.addMember(userId, circle.id);
    return circle;
  }

  return {
    async create(userId: string, input: { name: string; city: string; geohash?: string; isPublic: boolean }) {
      const circle = await repo.create({
        name: input.name,
        city: input.city,
        isPublic: input.isPublic,
        geohash: input.geohash ? fuzzGeohash(input.geohash, GEOHASH_MAX_PRECISION) || null : null,
        slug: slugify(input.name),
        inviteCode: randomCode(8),
      });
      await repo.addMember(userId, circle.id);
      return { ...circle, memberCount: 1, isMember: true };
    },
    async listMine(userId: string) {
      return (await repo.listForUser(userId)).map((c) => toDto(c, true, true));
    },
    async discover(userId: string, city?: string) {
      const [pub, mine] = await Promise.all([repo.listPublic(city), repo.listForUser(userId)]);
      const mineIds = new Set(mine.map((c) => c.id));
      return pub.map((c) => toDto(c, mineIds.has(c.id), false));
    },
    async join(userId: string, input: { inviteCode?: string; circleId?: string }) {
      if (input.inviteCode) {
        const circle = await repo.findByInviteCode(input.inviteCode.toUpperCase());
        if (!circle) throw notFound("INVALID_INVITE_CODE");
        return join(userId, circle);
      }
      const circle = await repo.findById(input.circleId!);
      if (!circle) throw notFound("CIRCLE_NOT_FOUND");
      if (!circle.isPublic) throw forbidden("CIRCLE_IS_PRIVATE");
      return join(userId, circle);
    },
    /** Used by auth to attach a new user to the circle of their invite. */
    async joinByInviteCode(userId: string, inviteCode: string): Promise<boolean> {
      const circle = await repo.findByInviteCode(inviteCode.toUpperCase());
      if (!circle) return false;
      await join(userId, circle);
      return true;
    },
    async inviteCodeExists(inviteCode: string) {
      return !!(await repo.findByInviteCode(inviteCode.toUpperCase()));
    },
    leave: (userId: string, circleId: string) => repo.removeMember(userId, circleId),
    isMember: (userId: string, circleId: string) => repo.isMember(userId, circleId),

    /** Ids of circles the user belongs to. */
    async circleIdsOf(userId: string) {
      return (await repo.listForUser(userId)).map((c) => c.id);
    },
    /** True when both users share at least one circle. */
    async shareCircle(a: string, b: string) {
      return (await this.sharedCircleNames(a, b)).length > 0;
    },
    async sharedCircleNames(a: string, b: string): Promise<string[]> {
      const rows = await repo.memberships([a, b]);
      const mineIds = new Set(rows.filter((r) => r.userId === a).map((r) => r.circleId));
      return rows.filter((r) => r.userId === b && mineIds.has(r.circleId)).map((r) => r.circle.name);
    },
    /** For each owner, the names of circles shared with the viewer (for feed cards). */
    async sharedCirclesByOwner(viewerId: string, ownerIds: string[]): Promise<Map<string, string[]>> {
      const rows = await repo.memberships([viewerId, ...ownerIds]);
      const mine = new Set(rows.filter((r) => r.userId === viewerId).map((r) => r.circleId));
      const out = new Map<string, string[]>();
      for (const r of rows) {
        if (r.userId === viewerId || !mine.has(r.circleId)) continue;
        out.set(r.userId, [...(out.get(r.userId) ?? []), r.circle.name]);
      }
      return out;
    },
    /** Owner ids in the viewer's circles, or in one specific circle (any circle when `anyCircle`). Used for optional feed filters only. */
    async visibleOwnerIds(viewerId: string, circleId?: string, anyCircle = false): Promise<string[]> {
      const circleIds = circleId
        ? anyCircle || (await repo.isMember(viewerId, circleId))
          ? [circleId]
          : []
        : await this.circleIdsOf(viewerId);
      return circleIds.length ? [...new Set(await repo.memberIdsOfCircles(circleIds))] : [];
    },
  };
}
