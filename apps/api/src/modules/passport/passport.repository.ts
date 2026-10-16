import type { Db } from "../../lib/db";

export function createPassportRepository(db: Db) {
  return {
    create: (data: { copyId: string; loanId: string; readerId: string; note: string; cityOrCircle: string | null }) =>
      db.bookPassportEntry.create({ data }),
    listByCopy: (copyId: string) => db.bookPassportEntry.findMany({ where: { copyId }, orderBy: { createdAt: "desc" } }),
    findByLoanIds: (loanIds: string[]) => db.bookPassportEntry.findMany({ where: { loanId: { in: loanIds } }, select: { loanId: true } }),
  };
}
export type PassportRepository = ReturnType<typeof createPassportRepository>;
