import type { Db } from "../../lib/db";

export function createCircleRepository(db: Db) {
  return {
    findById: (id: string) => db.circle.findUnique({ where: { id } }),
    findByInviteCode: (inviteCode: string) => db.circle.findUnique({ where: { inviteCode } }),
    findBySlug: (slug: string) => db.circle.findUnique({ where: { slug } }),
    create: (data: { name: string; slug: string; city: string; geohash?: string | null; isPublic: boolean; inviteCode: string }) =>
      db.circle.create({ data }),
    listPublic: (city?: string) =>
      db.circle.findMany({
        where: { isPublic: true, ...(city ? { city } : {}) },
        orderBy: { name: "asc" },
        include: { _count: { select: { members: true } } },
      }),
    listForUser: (userId: string) =>
      db.circle.findMany({
        where: { members: { some: { userId } } },
        orderBy: { name: "asc" },
        include: { _count: { select: { members: true } } },
      }),
    addMember: (userId: string, circleId: string) =>
      db.userCircle.upsert({ where: { userId_circleId: { userId, circleId } }, update: {}, create: { userId, circleId } }),
    removeMember: (userId: string, circleId: string) => db.userCircle.deleteMany({ where: { userId, circleId } }),
    isMember: async (userId: string, circleId: string) => (await db.userCircle.count({ where: { userId, circleId } })) > 0,
    memberships: (userIds: string[]) =>
      db.userCircle.findMany({ where: { userId: { in: userIds } }, include: { circle: { select: { id: true, name: true } } } }),
    memberIdsOfCircles: async (circleIds: string[]) =>
      (await db.userCircle.findMany({ where: { circleId: { in: circleIds } }, select: { userId: true } })).map((m) => m.userId),
  };
}
export type CircleRepository = ReturnType<typeof createCircleRepository>;
