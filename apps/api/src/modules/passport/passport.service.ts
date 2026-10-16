import { isUniqueViolation } from "../../lib/db";
import { badRequest, conflict, forbidden } from "../../lib/errors";
import type { CatalogService } from "../catalog";
import type { CirclesService } from "../circles";
import type { CirculationService } from "../circulation";
import type { UsersService } from "../users";
import type { PassportRepository } from "./passport.repository";

export type PassportService = ReturnType<typeof createPassportService>;

export function createPassportService(deps: {
  repo: PassportRepository;
  catalog: CatalogService;
  circulation: CirculationService;
  circles: CirclesService;
  users: UsersService;
}) {
  const { repo, catalog, circulation, circles, users } = deps;

  return {
    /** The copy's full history, newest first, with each reader's public profile. */
    async timeline(copyId: string) {
      const copy = await catalog.getCopy(copyId); // 404s for unknown copies
      const entries = await repo.listByCopy(copyId);
      const readers = await users.getPublicMany(entries.map((e) => e.readerId));
      return {
        copy: { id: copy.id, title: copy.edition.title, owner: copy.owner, addedAt: copy.createdAt },
        entries: entries.map((e) => ({
          id: e.id,
          loanId: e.loanId,
          note: e.note,
          cityOrCircle: e.cityOrCircle,
          createdAt: e.createdAt,
          reader: readers.get(e.readerId) ?? null,
        })),
      };
    },

    /** A borrower leaves one short memory per returned loan. */
    async addEntry(readerId: string, copyId: string, input: { loanId: string; note: string }) {
      const loan = await circulation.getLoanSummary(input.loanId);
      if (loan.copyId !== copyId) throw badRequest("LOAN_COPY_MISMATCH");
      if (loan.borrowerId !== readerId) throw forbidden("NOT_THE_BORROWER");
      if (loan.state !== "RETURNED") throw conflict("LOAN_NOT_RETURNED");
      const shared = await circles.sharedCircleNames(loan.lenderId, readerId);
      try {
        const entry = await repo.create({ copyId, loanId: loan.id, readerId, note: input.note, cityOrCircle: shared[0] ?? null });
        return { id: entry.id, loanId: entry.loanId, note: entry.note, cityOrCircle: entry.cityOrCircle, createdAt: entry.createdAt };
      } catch (err) {
        if (isUniqueViolation(err)) throw conflict("ENTRY_ALREADY_EXISTS");
        throw err;
      }
    },

    /** Returned loans for which the borrower has not yet written a passport note. */
    async pendingNotes(readerId: string) {
      const returned = await circulation.listReturnedAsBorrower(readerId);
      const done = new Set((await repo.findByLoanIds(returned.map((l) => l.id))).map((e) => e.loanId));
      return returned
        .filter((l) => !done.has(l.id))
        .map((l) => ({ loanId: l.id, copyId: l.copy.id, title: l.copy.title, returnedAt: l.returnedAt }));
    },
  };
}
