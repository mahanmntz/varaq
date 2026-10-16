import { Prisma, type BookCondition, type LoanState } from "@prisma/client";
import type { Db, Tx } from "../../lib/db";

const pub = { select: { id: true, username: true, firstName: true, avatarId: true, trustScore: true, karmaTokens: true } } as const;
export const loanInclude = {
  copy: { include: { edition: { select: { id: true, isbn: true, title: true, authors: true, coverUrl: true } } } },
  lender: pub,
  borrower: pub,
} satisfies Prisma.LoanInclude;
export type LoanRow = Prisma.LoanGetPayload<{ include: typeof loanInclude }>;

export function createLoanRepository(db: Db) {
  const c = (tx?: Tx) => tx ?? db;
  return {
    transaction: <T>(fn: (tx: Tx) => Promise<T>) => db.$transaction(fn),

    find: (id: string, tx?: Tx) => c(tx).loan.findUnique({ where: { id }, include: loanInclude }),
    create: (data: Prisma.LoanUncheckedCreateInput, tx?: Tx) => c(tx).loan.create({ data, include: loanInclude }),

    /** Compare-and-set on `state`; returns false if someone else already moved the loan. */
    async moveState(id: string, from: LoanState, data: Prisma.LoanUncheckedUpdateManyInput, tx?: Tx): Promise<boolean> {
      const res = await c(tx).loan.updateMany({ where: { id, state: from }, data });
      return res.count === 1;
    },
    async bumpPinAttempts(id: string): Promise<void> {
      await db.loan.update({ where: { id }, data: { pinAttempts: { increment: 1 } } });
    },
    countOpenRequest: (copyId: string, borrowerId: string) =>
      db.loan.count({ where: { copyId, borrowerId, state: { in: ["REQUESTED", "APPROVED", "ACTIVE", "OVERDUE"] } } }),

    listForUser: (userId: string, filter: { role?: "borrower" | "lender"; state?: LoanState }) =>
      db.loan.findMany({
        where: {
          ...(filter.role === "borrower"
            ? { borrowerId: userId }
            : filter.role === "lender"
              ? { lenderId: userId }
              : { OR: [{ borrowerId: userId }, { lenderId: userId }] }),
          ...(filter.state ? { state: filter.state } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: loanInclude,
      }),
    listReturnedForBorrower: (borrowerId: string) =>
      db.loan.findMany({ where: { borrowerId, state: "RETURNED" }, orderBy: { returnedAt: "desc" }, include: loanInclude }),
    findOverdueCandidates: (now: Date) =>
      db.loan.findMany({ where: { state: "ACTIVE", dueDate: { lt: now } }, select: { id: true, borrowerId: true } }),
    countActive: () => db.loan.count({ where: { state: { in: ["ACTIVE", "OVERDUE"] } } }),
    countCompleted: () => db.loan.count({ where: { state: "RETURNED" } }),
    /** Lenders ranked by number of completed internal loans. */
    async topLenders(limit: number) {
      const rows = await db.loan.groupBy({
        by: ["lenderId"],
        where: { state: "RETURNED", borrowerId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { lenderId: "desc" } },
        take: limit,
      });
      return rows.map((r) => ({ lenderId: r.lenderId, lentCount: r._count._all }));
    },
    recentReturned: (take: number) =>
      db.loan.findMany({ where: { state: "RETURNED" }, orderBy: { returnedAt: "desc" }, take, include: loanInclude }),
    setCondition: (id: string, condition: BookCondition) => db.loan.update({ where: { id }, data: { returnCondition: condition } }),
  };
}
export type LoanRepository = ReturnType<typeof createLoanRepository>;
