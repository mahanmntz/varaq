import type { LoanState } from "@varaq/shared";

/**
 * Pure loan state machine. No I/O, so every rule is unit-testable.
 *
 *   REQUESTED ──APPROVE──▶ APPROVED ──HANDOVER──▶ ACTIVE ──RETURN──▶ RETURNED
 *       │                     │                    │  ▲
 *       └──────CANCEL─────────┴──▶ CANCELLED       │  └── RETURN ── OVERDUE
 *                                                  └─MARK_OVERDUE─▶ OVERDUE
 */
export type LoanEvent = "APPROVE" | "HANDOVER" | "RETURN" | "CANCEL" | "MARK_OVERDUE";
export type LoanActor = "LENDER" | "BORROWER" | "SYSTEM";

export class InvalidTransitionError extends Error {
  constructor(
    public readonly state: LoanState,
    public readonly event: LoanEvent,
  ) {
    super(`Cannot apply ${event} to a loan in state ${state}`);
  }
}
export class ForbiddenActorError extends Error {
  constructor(
    public readonly event: LoanEvent,
    public readonly actor: LoanActor,
  ) {
    super(`${actor} may not perform ${event}`);
  }
}

const TRANSITIONS: Record<LoanState, Partial<Record<LoanEvent, LoanState>>> = {
  REQUESTED: { APPROVE: "APPROVED", CANCEL: "CANCELLED" },
  APPROVED: { HANDOVER: "ACTIVE", CANCEL: "CANCELLED" },
  ACTIVE: { RETURN: "RETURNED", MARK_OVERDUE: "OVERDUE" },
  OVERDUE: { RETURN: "RETURNED" },
  RETURNED: {},
  CANCELLED: {},
};

/** Who may trigger each event. The receiver of the book confirms with the PIN. */
const ALLOWED_ACTORS: Record<LoanEvent, LoanActor[]> = {
  APPROVE: ["LENDER"],
  HANDOVER: ["BORROWER"], // borrower enters the PIN shown on the lender's phone
  RETURN: ["LENDER"], // lender enters the PIN shown on the borrower's phone
  CANCEL: ["LENDER", "BORROWER"],
  MARK_OVERDUE: ["SYSTEM"],
};

export function nextState(state: LoanState, event: LoanEvent): LoanState {
  const next = TRANSITIONS[state][event];
  if (!next) throw new InvalidTransitionError(state, event);
  return next;
}

export function transition(state: LoanState, event: LoanEvent, actor: LoanActor): LoanState {
  const next = nextState(state, event);
  if (!ALLOWED_ACTORS[event].includes(actor)) throw new ForbiddenActorError(event, actor);
  return next;
}

export const canTransition = (state: LoanState, event: LoanEvent) => !!TRANSITIONS[state][event];
/** States in which the book is spoken for (not yet back on the shelf). */
export const isOpen = (state: LoanState) => state !== "RETURNED" && state !== "CANCELLED";

export function actorOf(loan: { lenderId: string; borrowerId: string | null }, userId: string): LoanActor | null {
  if (loan.lenderId === userId) return "LENDER";
  if (loan.borrowerId === userId) return "BORROWER";
  return null;
}

export const TRUST = { onTime: 2, overdue: -5 } as const;

export type Settlement = { borrowerTokens: number; lenderTokens: number; borrowerTrust: number };

/**
 * Karma economy effects of an event.
 * - APPROVE locks 1 of the borrower's tokens.
 * - CANCEL refunds a locked token.
 * - RETURN unlocks the borrower's token and pays the lender +1.
 * External loans (no borrower) never touch tokens.
 */
export function settle(event: LoanEvent, ctx: { fromState: LoanState; tokenLocked: boolean; isExternal: boolean }): Settlement {
  const none: Settlement = { borrowerTokens: 0, lenderTokens: 0, borrowerTrust: 0 };
  if (ctx.isExternal) return none;
  switch (event) {
    case "APPROVE":
      return { ...none, borrowerTokens: -1 };
    case "CANCEL":
      return { ...none, borrowerTokens: ctx.tokenLocked ? 1 : 0 };
    case "RETURN":
      return {
        borrowerTokens: ctx.tokenLocked ? 1 : 0,
        lenderTokens: 1,
        borrowerTrust: ctx.fromState === "OVERDUE" ? 0 : TRUST.onTime,
      };
    case "MARK_OVERDUE":
      return { ...none, borrowerTrust: TRUST.overdue };
    default:
      return none;
  }
}
