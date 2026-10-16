"use client";
import { isValidNationalId, normalizeJalaliDate } from "@varaq/shared";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { mutate } from "@/lib/use-api";

/** National code + Jalali birth date form shared by the verify page and the borrow sheet. */
export function IdentityForm({ submitLabel = "ثبت و تایید", onDone }: { submitLabel?: string; onDone?: () => void }) {
  const { refresh } = useAuth();
  const [nationalId, setNationalId] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const idErr = isValidNationalId(nationalId) ? "" : "کد ملی معتبر نیست (۱۰ رقم).";
  const dateErr = normalizeJalaliDate(birthDate) ? "" : "تاریخ را مثل ۱۳۷۸/۰۴/۱۵ وارد کنید.";

  async function submit() {
    setTouched(true);
    if (idErr || dateErr) return;
    setBusy(true);
    const res = await mutate(() => api("/users/me/identity", { method: "PATCH", body: { nationalId, birthDate } }), "احراز هویت انجام شد.");
    setBusy(false);
    if (res) {
      await refresh();
      onDone?.();
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div>
        <Label>کد ملی</Label>
        <Input
          inputMode="numeric"
          maxLength={10}
          autoFocus
          placeholder="کد ۱۰ رقمی ملی"
          value={nationalId}
          onChange={(e) => setNationalId(e.target.value)}
        />
        {touched && idErr && (
          <p role="alert" className="mt-1 text-xs text-danger">
            {idErr}
          </p>
        )}
      </div>
      <div>
        <Label>تاریخ تولد (شمسی)</Label>
        <Input inputMode="numeric" placeholder="۱۳۷۸/۰۴/۱۵" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        {touched && dateErr && (
          <p role="alert" className="mt-1 text-xs text-danger">
            {dateErr}
          </p>
        )}
      </div>
      <Button className="w-full" disabled={busy}>
        {submitLabel}
      </Button>
    </form>
  );
}
