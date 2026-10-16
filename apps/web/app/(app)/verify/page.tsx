"use client";
import { BadgeCheck, BookPlus, Compass, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { IdentityForm } from "@/components/identity-form";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/misc";
import { useAuth } from "@/lib/auth";

export default function VerifyPage() {
  const { me } = useAuth();
  if (!me) return null;

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="احراز هویت" subtitle="برای اعتماد بین اعضا، قبل از افزودن کتاب یا امانت گرفتن یک‌بار انجام می‌شود" />

      {me.identityVerified ? (
        <Card className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
            <BadgeCheck size={34} />
          </div>
          <h2 className="text-lg font-extrabold">هویتت تایید شده است</h2>
          <p className="mt-1 text-sm text-muted-foreground">حالا می‌توانی کتاب اضافه کنی و کتاب امانت بگیری.</p>
          <div className="mt-5 flex justify-center gap-2">
            <Link href="/">
              <Button variant="outline">
                <Compass size={16} /> کشف کتاب
              </Button>
            </Link>
            <Link href="/library">
              <Button>
                <BookPlus size={16} /> کتابخانه من
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-accent-ink">
              <ShieldCheck size={24} />
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">
              تا وقتی احراز هویت نکرده‌ای، نمی‌توانی کتاب اضافه کنی یا امانت بگیری. دیدن و جستجوی کتاب‌ها آزاد است.
            </p>
          </div>
          <IdentityForm />
        </Card>
      )}
    </div>
  );
}
