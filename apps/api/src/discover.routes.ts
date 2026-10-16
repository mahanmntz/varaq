import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { CatalogService } from "./modules/catalog";
import type { CirculationService } from "./modules/circulation";
import type { UsersService } from "./modules/users";

/**
 * Read-only "platform pulse" for the Discover page. Lives in the composition root because it
 * aggregates several modules through their public service interfaces.
 */
export function discoverRoutes(deps: { catalog: CatalogService; circulation: CirculationService; users: UsersService }) {
  const { catalog, circulation, users } = deps;
  return async (app: FastifyInstance) => {
    const r = app.withTypeProvider<ZodTypeProvider>();
    r.get(
      "/discover/overview",
      {
        onRequest: [app.authenticate],
        schema: {
          tags: ["discover"],
          security: [{ bearerAuth: [] }],
          summary: "Platform stats, popular high-trust lenders and a live activity feed",
        },
      },
      async () => {
        const [availableBooks, activeLoans, completedLoans, members, ranked, added, returned] = await Promise.all([
          catalog.availableCount(),
          circulation.activeLoanCount(),
          circulation.completedLoanCount(),
          users.countUsers(),
          circulation.topLenders(5),
          catalog.recentlyAdded(6),
          circulation.recentReturns(4),
        ]);

        // Popular lenders first (most completed loans), then fill with the highest-trust users.
        const rankedUsers = await users.getPublicMany(ranked.map((x) => x.lenderId));
        const lenders = ranked.flatMap((x) =>
          rankedUsers.has(x.lenderId) ? [{ ...rankedUsers.get(x.lenderId)!, lentCount: x.lentCount }] : [],
        );
        for (const u of await users.topByTrust(8)) {
          if (lenders.length >= 5) break;
          if (!lenders.some((l) => l.id === u.id)) lenders.push({ ...u, lentCount: 0 });
        }

        const activity = [
          ...added.map((a) => ({ type: "added" as const, username: a.owner, title: a.title, at: a.at })),
          ...returned.map((a) => ({ type: "returned" as const, username: a.lender, title: a.title, at: a.at })),
        ].sort((a, b) => +new Date(b.at ?? 0) - +new Date(a.at ?? 0));

        return { stats: { availableBooks, activeLoans, completedLoans, members }, topLenders: lenders, activity };
      },
    );
  };
}
