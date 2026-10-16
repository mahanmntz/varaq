"use client";
import { displayName } from "@/lib/format";
import { PIN_LENGTH, type BookCondition } from "@varaq/shared";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConditionPicker } from "@/components/ui/condition-picker";
import { Input, Label } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import type { Loan } from "@/lib/types";
import { mutate } from "@/lib/use-api";

export type HandshakeMode = "handover" | "return";

/**
 * 2-step handshake drawer. The party RECEIVING the book types the 4-digit PIN shown on the
 * other person's phone and logs the physical condition.
 */
export function HandshakeSheet({
  loan,
  mode,
  onOpenChange,
  onDone,
}: {
  loan: Loan | null;
  mode: HandshakeMode;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const [pin, setPin] = useState("");
  const [condition, setCondition] = useState<BookCondition>("GOOD");
  const [busy, setBusy] = useState(false);
  const isHandover = mode === "handover";

  async function submit() {
    if (!loan) return;
    setBusy(true);
    const res = await mutate(
      () => api<Loan>(`/loans/${loan.id}/${isHandover ? "handover" : "return"}`, { method: "POST", body: { pin, condition } }),
      isHandover ? "تحویل ثبت شد؛ خواندن خوش!" : "بازگشت کتاب ثبت شد.",
    );
    setBusy(false);
    if (res) {
      setPin("");
      onOpenChange(false);
      onDone();
    }
  }

  return (
    <Sheet
      open={!!loan}
      onOpenChange={(o) => {
        if (!o) setPin("");
        onOpenChange(o);
      }}
      title={isHandover ? "دریافت کتاب" : "دریافت کتاب بازگشتی"}
      description={
        isHandover
          ? `کد ۴ رقمی را از ${loan ? displayName(loan.lender) : ""} بگیر و وارد کن.`
          : `کد ۴ رقمی را از ${loan?.borrower ? displayName(loan.borrower) : ""} بگیر و وارد کن.`
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div>
          <Label>کد تایید</Label>
          <Input
            dir="ltr"
            inputMode="numeric"
            autoFocus
            autoComplete="one-time-code"
            maxLength={PIN_LENGTH}
            className="h-16 text-center text-3xl font-bold tracking-[0.6em]"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div>
          <Label>{isHandover ? "وضعیت کتاب هنگام تحویل" : "وضعیت کتاب هنگام بازگشت"}</Label>
          <ConditionPicker value={condition} onChange={setCondition} />
        </div>
        <Button className="w-full" disabled={busy || pin.length !== PIN_LENGTH}>
          {isHandover ? "تایید دریافت" : "تایید بازگشت"}
        </Button>
      </form>
    </Sheet>
  );
}
