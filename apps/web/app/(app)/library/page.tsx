"use client";
import { BellRing, BookPlus, Coins, HandHelping, Library as LibraryIcon, Undo2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAddBook, LIBRARY_CHANGED } from "@/components/add-book-context";
import { motion } from "framer-motion";
import { BookCover } from "@/components/book-cover";
import { ExternalLoanSheet } from "@/components/external-loan-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { daysUntil, formatDate, toFaDigits } from "@/lib/format";
import { COPY_STATUS_LABEL } from "@/lib/labels";
import type { Copy, Loan } from "@/lib/types";
import { mutate, useApi } from "@/lib/use-api";

/** wa.me reminder link with a ready-to-send Persian message. */
function reminderLink(loan: Loan) {
  const text = `سلام ${loan.externalBorrowerName} 👋\nیادآوری دوستانه: کتاب «${loan.copy.title}» را تا ${formatDate(loan.dueDate)} برمی‌گردانی؟ ممنون! 📚`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export default function LibraryPage() {
  const { me, refresh } = useAuth();
  const copies = useApi<Copy[]>("/copies/mine");
  const loans = useApi<Loan[]>("/loans?role=lender");
  const { openAddBook } = useAddBook();
  const [lending, setLending] = useState<Copy | null>(null);

  const externalByCopy = useMemo(() => {
    const m = new Map<string, Loan>();
    for (const l of loans.data ?? []) if (l.isExternal && (l.state === "ACTIVE" || l.state === "OVERDUE")) m.set(l.copy.id, l);
    return m;
  }, [loans.data]);

  const reload = () => {
    void copies.reload();
    void loans.reload();
    void refresh();
  };
  useEffect(() => {
    window.addEventListener(LIBRARY_CHANGED, reload);
    return () => window.removeEventListener(LIBRARY_CHANGED, reload);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggle(c: Copy) {
    await mutate(() =>
      api(`/copies/${c.id}`, { method: "PATCH", body: { status: c.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE" } }),
    );
    reload();
  }
  async function markReturned(l: Loan) {
    await mutate(() => api(`/external-loans/${l.id}/return`, { method: "POST", body: {} }), "کتاب برگشت داده شد.");
    reload();
  }

  return (
    <>
      <PageHeader
        title="کتابخانه من"
        subtitle={copies.data ? `${toFaDigits(copies.data.length)} کتاب در قفسه` : undefined}
        action={
          <Button size="sm" onClick={openAddBook}>
            <BookPlus size={16} /> افزودن کتاب
          </Button>
        }
      />

      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-accent/30 bg-gradient-to-l from-accent/15 to-transparent p-4 text-sm">
        <Coins className="text-accent-ink" size={22} />
        <div className="flex-1">
          <b>{toFaDigits(me?.karmaTokens ?? 0)}</b> اعتبار امانت
          <p className="text-xs text-muted-foreground">
            با امانت دادن کتاب، اعتبار می‌گیری؛ با امانت گرفتن، یک اعتبار تا برگشت قفل می‌شود.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {copies.loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}
        {copies.data?.length === 0 && (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState
              icon={<LibraryIcon size={32} />}
              title="قفسه‌ات هنوز خالی است"
              hint="بارکد پشت کتاب را اسکن کن؛ ثبت هر کتاب چند ثانیه بیشتر طول نمی‌کشد."
            >
              <Button onClick={openAddBook}>
                <BookPlus size={16} /> اولین کتاب را اضافه کن
              </Button>
            </EmptyState>
          </div>
        )}
        {copies.data?.map((c) => {
          const ext = externalByCopy.get(c.id);
          const left = daysUntil(ext?.dueDate ?? null);
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 rounded-2xl border border-border/60 bg-card/80 p-3 shadow-paper backdrop-blur"
            >
              <Link href={`/books/${c.id}`}>
                <BookCover title={c.edition.title} author={c.edition.authors[0]} coverUrl={c.edition.coverUrl} className="w-20" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/books/${c.id}`} className="line-clamp-1 font-bold">
                  {c.edition.title}
                </Link>
                <p className="line-clamp-1 text-xs text-muted-foreground">{c.edition.authors.join("، ")}</p>
                <div className="mt-1.5">
                  <Badge tone={c.status === "AVAILABLE" ? "success" : c.status === "UNAVAILABLE" ? "neutral" : "accent"}>
                    {COPY_STATUS_LABEL[c.status]}
                  </Badge>
                </div>

                {ext && (
                  <div className="mt-2 rounded-md bg-accent/10 p-2 text-xs">
                    نزد <b>{ext.externalBorrowerName}</b> · برگشت {formatDate(ext.dueDate)}
                    {left !== null && left < 0 && <span className="text-danger"> ({toFaDigits(-left)} روز دیرکرد)</span>}
                    <div className="mt-2 flex gap-2">
                      <a href={reminderLink(ext)} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline">
                          <BellRing size={14} /> یادآوری
                        </Button>
                      </a>
                      <Button size="sm" variant="outline" onClick={() => markReturned(ext)}>
                        <Undo2 size={14} /> برگشت داده شد
                      </Button>
                    </div>
                  </div>
                )}
                {(c.status === "AVAILABLE" || c.status === "UNAVAILABLE") && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setLending(c)}>
                      <HandHelping size={14} /> ثبت امانت دستی به دوست
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggle(c)}>
                      {c.status === "AVAILABLE" ? "غیرفعال کردن" : "آماده امانت"}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <ExternalLoanSheet copy={lending} onOpenChange={(o) => !o && setLending(null)} onDone={reload} />
    </>
  );
}
