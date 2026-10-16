import { describe, expect, it } from "vitest";
import { LOAN_STATES, type LoanState } from "@varaq/shared";
import {
  ForbiddenActorError,
  InvalidTransitionError,
  actorOf,
  canTransition,
  isOpen,
  nextState,
  settle,
  transition,
  type LoanEvent,
} from "./loan-state-machine";

describe("loan state machine", () => {
  it("walks the happy path REQUESTED -> APPROVED -> ACTIVE -> RETURNED", () => {
    let s: LoanState = "REQUESTED";
    s = transition(s, "APPROVE", "LENDER");
    expect(s).toBe("APPROVED");
    s = transition(s, "HANDOVER", "BORROWER");
    expect(s).toBe("ACTIVE");
    s = transition(s, "RETURN", "LENDER");
    expect(s).toBe("RETURNED");
  });

  it("allows an overdue loan to be returned", () => {
    expect(transition("ACTIVE", "MARK_OVERDUE", "SYSTEM")).toBe("OVERDUE");
    expect(transition("OVERDUE", "RETURN", "LENDER")).toBe("RETURNED");
  });

  it("allows both parties to cancel before handover, but not after", () => {
    for (const state of ["REQUESTED", "APPROVED"] as const) {
      expect(transition(state, "CANCEL", "LENDER")).toBe("CANCELLED");
      expect(transition(state, "CANCEL", "BORROWER")).toBe("CANCELLED");
    }
    expect(() => nextState("ACTIVE", "CANCEL")).toThrow(InvalidTransitionError);
    expect(() => nextState("OVERDUE", "CANCEL")).toThrow(InvalidTransitionError);
  });

  it("treats RETURNED and CANCELLED as terminal", () => {
    const events: LoanEvent[] = ["APPROVE", "HANDOVER", "RETURN", "CANCEL", "MARK_OVERDUE"];
    for (const state of ["RETURNED", "CANCELLED"] as const) {
      for (const e of events) expect(canTransition(state, e)).toBe(false);
    }
  });

  it("rejects skipping steps", () => {
    expect(() => nextState("REQUESTED", "HANDOVER")).toThrow(InvalidTransitionError);
    expect(() => nextState("REQUESTED", "RETURN")).toThrow(InvalidTransitionError);
    expect(() => nextState("APPROVED", "RETURN")).toThrow(InvalidTransitionError);
    expect(() => nextState("APPROVED", "MARK_OVERDUE")).toThrow(InvalidTransitionError);
  });

  it("enforces who may perform each event", () => {
    expect(() => transition("REQUESTED", "APPROVE", "BORROWER")).toThrow(ForbiddenActorError);
    expect(() => transition("APPROVED", "HANDOVER", "LENDER")).toThrow(ForbiddenActorError);
    expect(() => transition("ACTIVE", "RETURN", "BORROWER")).toThrow(ForbiddenActorError);
    expect(() => transition("ACTIVE", "MARK_OVERDUE", "LENDER")).toThrow(ForbiddenActorError);
  });

  it("reports which states are open", () => {
    const open = LOAN_STATES.filter(isOpen);
    expect(open).toEqual(["REQUESTED", "APPROVED", "ACTIVE", "OVERDUE"]);
  });

  it("identifies the actor of a loan", () => {
    const loan = { lenderId: "a", borrowerId: "b" };
    expect(actorOf(loan, "a")).toBe("LENDER");
    expect(actorOf(loan, "b")).toBe("BORROWER");
    expect(actorOf(loan, "c")).toBeNull();
    expect(actorOf({ lenderId: "a", borrowerId: null }, "b")).toBeNull();
  });
});

describe("karma settlement", () => {
  const ctx = { fromState: "REQUESTED" as LoanState, tokenLocked: false, isExternal: false };

  it("locks one borrower token on approval", () => {
    expect(settle("APPROVE", ctx)).toEqual({ borrowerTokens: -1, lenderTokens: 0, borrowerTrust: 0 });
  });
  it("refunds a locked token on cancel, and nothing if none was locked", () => {
    expect(settle("CANCEL", { ...ctx, tokenLocked: true }).borrowerTokens).toBe(1);
    expect(settle("CANCEL", ctx).borrowerTokens).toBe(0);
  });
  it("unlocks the borrower token, pays the lender and rewards on-time returns", () => {
    expect(settle("RETURN", { ...ctx, fromState: "ACTIVE", tokenLocked: true })).toEqual({
      borrowerTokens: 1,
      lenderTokens: 1,
      borrowerTrust: 2,
    });
  });
  it("gives no trust bonus for overdue returns", () => {
    expect(settle("RETURN", { ...ctx, fromState: "OVERDUE", tokenLocked: true }).borrowerTrust).toBe(0);
  });
  it("penalizes trust when a loan goes overdue", () => {
    expect(settle("MARK_OVERDUE", { ...ctx, fromState: "ACTIVE", tokenLocked: true }).borrowerTrust).toBe(-5);
  });
  it("never touches tokens for external loans", () => {
    for (const e of ["APPROVE", "CANCEL", "RETURN", "MARK_OVERDUE"] as const) {
      expect(settle(e, { fromState: "ACTIVE", tokenLocked: false, isExternal: true })).toEqual({
        borrowerTokens: 0,
        lenderTokens: 0,
        borrowerTrust: 0,
      });
    }
  });
});
