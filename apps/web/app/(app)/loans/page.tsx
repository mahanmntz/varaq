"use client";
import { PenLine, Repeat } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { HandshakeSheet, type HandshakeMode } from "@/components/handshake-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, displayName } from "@/lib/format";
import { CONDITION_LABEL, LOAN_STATE_LABEL } from "@/lib/labels";
import type { Loan } from "@/lib/types";
import { mutate, useApi } from "@/lib/use-api";

const TONE = {
  REQUESTED: "neutral",
  APPROVED: "accent",
  ACTIVE: "primary",
  RETURNED: "success",
  OVERDUE: "danger",
  CANCELLED: "neutral",
} as const;
type Pending = { loanId: string; copyId: string; title: string };

function PinCard({ pin, hint }: { pin: string; hint: string }) {
  return (
    <div className="mt-3 rounded-md border border-dashed border-accent bg-accent/10 p-3 text-center">
      <div className="text-[11px] text-muted-foreground">{hint}</div>
      <div dir="ltr" className="mt-1 text-4xl font-extrabold tracking-[0.5em] ps-[0.5em]">
        {pin}
      </div>
    </div>
  );
}

export default function LoansPage() {
  const { refresh } = useAuth();
  const loans = useApi<Loan[]>("/loans");
  const pending = useApi<Pending[]>("/passport/pending");
  const [handshake, setHandshake] = useState<{ loan: Loan; mode: HandshakeMode } | null>(null);

  const reload = () => {
    void loans.reload();
    void pending.reload();
    void refresh();
  };
  const act = async (id: string, action: "approve" | "cancel", ok: string) => {
    await mutate(() => api(`/loans/${id}/${action}`, { method: "POST", body: action === "approve" ? {} : undefined }), ok);
    reload();
  };

  const internal = (loans.data ?? []).filter((l) => !l.isExternal);
  const incoming = internal.filter((l) => l.myRole === "lender");
  const outgoing = internal.filter((l) => l.myRole === "borrower");

  function LoanCard({ loan }: { loan: Loan }) {
    const other = loan.myRole === "lender" ? loan.borrower : loan.lender;
    const isLender = loan.myRole === "lender";
    return (
      <Card>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/books/${loan.copy.id}`} className="line-clamp-1 font-bold">
              {loan.copy.title}
            </Link>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              {other && <Avatar id={other.avatarId} size={18} />}
              <span>
                {isLender ? "→" : "←"} {other ? displayName(other) : ""}
              </span>
            </div>
          </div>
          <Badge tone={TONE[loan.state]}>{LOAN_STATE_LABEL[loan.state]}</Badge>
        </div>

        {(loan.dueDate || loan.handoverCondition) && (
          <p className="mt-2 text-xs text-muted-foreground">
            {loan.dueDate && <>سررسید: {formatDate(loan.dueDate)} </>}
            {loan.handoverCondition && <>· تحویل: {CONDITION_LABEL[loan.handoverCondition]} </>}
            {loan.returnCondition && <>· بازگشت: {CONDITION_LABEL[loan.returnCondition]}</>}
          </p>
        )}

        {loan.pin && loan.state === "APPROVED" && <PinCard pin={loan.pin} hint="این کد را هنگام تحویل کتاب به امانت‌گیرنده بگو" />}
        {loan.pin && (loan.state === "ACTIVE" || loan.state === "OVERDUE") && (
          <PinCard pin={loan.pin} hint="هنگام پس دادن کتاب، این کد را به صاحبش بگو" />
        )}
        {loan.pinLocked && <p className="mt-2 text-xs text-danger">به‌خاطر چند اشتباه پشت‌سرهم قفل شد.</p>}

        <div className="mt-3 flex flex-wrap gap-2">
          {isLender && loan.state === "REQUESTED" && (
            <>
              <Button size="sm" onClick={() => act(loan.id, "approve", "تایید شد؛ کد تحویل ساخته شد.")}>
                تایید درخواست
              </Button>
              <Button size="sm" variant="outline" onClick={() => act(loan.id, "cancel", "درخواست رد شد.")}>
                رد کردن
              </Button>
            </>
          )}
          {!isLender && loan.state === "APPROVED" && (
            <Button size="sm" onClick={() => setHandshake({ loan, mode: "handover" })}>
              کتاب را گرفتم
            </Button>
          )}
          {isLender && (loan.state === "ACTIVE" || loan.state === "OVERDUE") && (
            <Button size="sm" onClick={() => setHandshake({ loan, mode: "return" })}>
              کتاب را پس گرفتم
            </Button>
          )}
          {((loan.state === "REQUESTED" && !isLender) || loan.state === "APPROVED") && (
            <Button size="sm" variant="ghost" onClick={() => act(loan.id, "cancel", "امانت لغو شد.")}>
              لغو
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const Section = ({ title, items, empty }: { title: string; items: Loan[]; empty: string }) => (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-bold text-muted-foreground">{title}</h2>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">{empty}</p>
        ) : (
          items.map((l) => <LoanCard key={l.id} loan={l} />)
        )}
      </div>
    </section>
  );

  return (
    <>
      <PageHeader title="امانت‌ها" subtitle="درخواست‌ها، کدهای تحویل و تاریخچه" />

      {pending.data && pending.data.length > 0 && (
        <div className="rounded-lg border border-accent/40 bg-accent/10 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-bold">
            <PenLine size={16} /> یادداشتی برای پاسپورت کتاب بگذار
          </p>
          {pending.data.map((p) => (
            <Link key={p.loanId} href={`/books/${p.copyId}#passport`} className="block py-1 text-sm underline">
              «{p.title}» را خواندی؛ خاطره‌ات را بنویس
            </Link>
          ))}
        </div>
      )}

      {loans.loading && (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      )}
      {!loans.loading && internal.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<Repeat size={32} />}
            title="هنوز امانتی نداری"
            hint="از صفحه «کشف» کتابی را درخواست بده یا کتاب خودت را آماده امانت کن."
          />
        </div>
      ) : (
        <div className="grid gap-x-8 lg:grid-cols-2">
          <Section title="درخواست‌های دریافتی (کتاب‌های من)" items={incoming} empty="درخواستی برای کتاب‌هایت نیست." />
          <Section title="امانت‌گرفته‌های من" items={outgoing} empty="کتابی امانت نگرفته‌ای." />
        </div>
      )}

      <HandshakeSheet
        loan={handshake?.loan ?? null}
        mode={handshake?.mode ?? "handover"}
        onOpenChange={(o) => !o && setHandshake(null)}
        onDone={reload}
      />
    </>
  );
}
