"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Coins, Eye, EyeOff, Heart, LogOut, Lock, Pencil, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/avatar";
import { IdentitySheet } from "@/components/identity-sheet";
import { AvatarPickerModal } from "@/components/avatar-picker-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { TrustRing } from "@/components/trust-ring";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, PageHeader } from "@/components/ui/misc";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toFaDigits, displayName } from "@/lib/format";
import { mutate } from "@/lib/use-api";

function Row({ label, value, ltr }: { label: string; value: string | null; ltr?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span dir={ltr ? "ltr" : undefined} className="text-sm font-bold">
        {value || "—"}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const { me, refresh, logout } = useAuth();
  const [username, setUsername] = useState("");
  const [picker, setPicker] = useState(false);
  const [kycOpen, setKycOpen] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [identityOpen, setIdentityOpen] = useState(false);

  useEffect(() => {
    if (me) setUsername(me.username);
  }, [me]);
  if (!me) return null;
  const id = me.identity;
  const masked = id.nationalId ? id.nationalId.slice(0, 3) + "••••" + id.nationalId.slice(-3) : null;

  async function saveAvatar(avatarId: number) {
    setBusy(true);
    const res = await mutate(() => api("/users/me", { method: "PATCH", body: { avatarId } }), "آواتار ذخیره شد.");
    setBusy(false);
    if (res) await refresh();
  }
  async function saveUsername() {
    setBusy(true);
    const res = await mutate(() => api("/users/me", { method: "PATCH", body: { username } }), "نام کاربری ذخیره شد.");
    setBusy(false);
    if (res) await refresh();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="پروفایل" />

      {/* Header: glowing avatar + handle + stats */}
      <Card className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -top-16 start-1/3 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative">
            <div className="rounded-full bg-gradient-to-tr from-primary via-emerald-300 to-amber-300 p-1 shadow-glow">
              <div className="rounded-full bg-background p-1">
                <Avatar id={me.avatarId} size={96} />
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setPicker(true)}
              aria-label="تغییر آواتار"
              title="تغییر آواتار"
              className="absolute -bottom-1 -end-1 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg ring-4 ring-background"
            >
              <Pencil size={16} />
            </motion.button>
          </div>
          <div className="flex-1 text-center sm:text-start">
            <div className="text-2xl font-extrabold">{displayName(me)}</div>
            <div dir="ltr" className="text-sm text-muted-foreground sm:text-end">
              @{me.username}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <span className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2">
                <TrustRing value={me.trustScore} size={40} />
                <span className="text-xs leading-tight">
                  <b className="block text-sm">امتیاز اعتماد</b>
                  <span className="text-muted-foreground">از ۱۰۰</span>
                </span>
              </span>
              <span className="flex items-center gap-2 rounded-2xl bg-accent/15 px-3 py-2 text-accent-ink">
                <Coins size={22} />
                <span className="text-xs leading-tight">
                  <b className="block text-lg">{toFaDigits(me.karmaTokens)}</b>اعتبار امانت
                </span>
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Private KYC */}
        <Card className="self-start">
          <button
            className="flex w-full items-center justify-between gap-3 text-start"
            onClick={() => setKycOpen(!kycOpen)}
            aria-expanded={kycOpen}
          >
            <span className="flex items-center gap-2.5 font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-300">
                <Lock size={17} />
              </span>
              <span className="text-sm leading-snug">
                اطلاعات هویتی محرمانه
                <br />
                <span className="text-xs font-normal text-muted-foreground">(فقط قابل مشاهده برای شما)</span>
              </span>
            </span>
            <ChevronDown size={20} className={`transition-transform ${kycOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {kycOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3">
                  <Row label="نام" value={id.firstName} />
                  <Row label="نام خانوادگی" value={id.lastName} />
                  <Row label="شماره موبایل" value={id.phoneNumber} ltr />
                  <Row label="تاریخ تولد" value={id.birthDate} ltr />
                  {(!id.nationalId || !id.birthDate) && (
                    <Button size="sm" variant="accent" className="mt-3 w-full" onClick={() => setIdentityOpen(true)}>
                      تکمیل کد ملی و تاریخ تولد
                    </Button>
                  )}
                  <div className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-sm text-muted-foreground">کد ملی</span>
                    <span className="flex items-center gap-2">
                      <span dir="ltr" className="text-sm font-bold">
                        {reveal ? id.nationalId : masked}
                      </span>
                      <button
                        onClick={() => setReveal(!reveal)}
                        aria-label={reveal ? "پنهان کردن کد ملی" : "نمایش کد ملی"}
                        className="text-muted-foreground"
                      >
                        {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </span>
                  </div>
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-600" /> این اطلاعات هرگز در کارت کتاب، پروفایل عمومی،
                    امانت‌ها یا پاسپورت کتاب نمایش داده نمی‌شود.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <div className="space-y-5">
          <Card>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void saveUsername();
              }}
            >
              <Label>نام کاربری عمومی</Label>
              <div className="flex gap-2">
                <Input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={25} placeholder="نام کاربری" />
                <Button disabled={busy || username.replace(/^@/, "") === me.username || username.replace(/^@/, "").length < 3}>
                  ذخیره
                </Button>
              </div>
            </form>
          </Card>
          <Card className="flex flex-wrap items-center gap-2">
            <Link href="/wishlist">
              <Button variant="outline" size="sm">
                <Heart size={16} /> علاقه‌مندی‌ها
              </Button>
            </Link>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut size={16} /> خروج از حساب
            </Button>
          </Card>
        </div>
      </div>

      <IdentitySheet open={identityOpen} onOpenChange={setIdentityOpen} />
      <AvatarPickerModal open={picker} onOpenChange={setPicker} value={me.avatarId} onSave={saveAvatar} busy={busy} />
    </div>
  );
}
