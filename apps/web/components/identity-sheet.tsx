"use client";
import { IdentityForm } from "@/components/identity-form";
import { Sheet } from "@/components/ui/sheet";

/** Asks for identity details in-context (e.g. right when someone tries to borrow). */
export function IdentitySheet({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; onDone?: () => void }) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="احراز هویت"
      description="برای امانت گرفتن لازم است. فقط خودت می‌بینی؛ برای دیگران نمایش داده نمی‌شود."
    >
      <IdentityForm
        submitLabel="ذخیره و ادامه"
        onDone={() => {
          onOpenChange(false);
          onDone?.();
        }}
      />
    </Sheet>
  );
}
