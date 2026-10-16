"use client";
import { BookMarked, Send } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { BookCover } from "@/components/book-cover";
import { HeartButton } from "@/components/heart-button";
import { TrustRing } from "@/components/trust-ring";
import { PassportTimelineView } from "@/components/passport-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { IdentitySheet } from "@/components/identity-sheet";
import { ApiError } from "@/lib/api";
import { toast } from "@/lib/notify";
import { errorMessage } from "@/lib/labels";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isoDateInput, toFaDigits, displayName } from "@/lib/format";
import { CONDITION_LABEL, COPY_STATUS_LABEL } from "@/lib/labels";
import type { Copy, Loan, PassportTimeline } from "@/lib/types";
import { mutate, useApi } from "@/lib/use-api";
import { PASSPORT_NOTE_MAX } from "@varaq/shared";

type Pending = { loanId: string; copyId: string; title: string };

export default function BookPage() {
  const { id } = useParams<{ id: string }>();
  const { me } = useAuth();
  const copy = useApi<Copy>(`/copies/${id}`);
  const passport = useApi<PassportTimeline>(`/copies/${id}/passport`);
  const pending = useApi<Pending[]>("/passport/pending");
  const [requesting, setRequesting] = useState(false);
  const [due, setDue] = useState(isoDateInput(21));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [needIdentity, setNeedIdentity] = useState(false);

  if (copy.loading)
    return (
      <div className="space-y-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-24" />
      </div>
    );
  if (!copy.data) return <EmptyState title="این کتاب پیدا نشد" />;

  const c = copy.data;
  const isOwner = me?.id === c.owner.id;
  const myPending = pending.data?.find((p) => p.copyId === c.id);

  async function request() {
    setBusy(true);
    try {
      await api<Loan>("/loans", { method: "POST", body: { copyId: c.id, dueDate: new Date(due + "T12:00:00").toISOString() } });
      toast.success("درخواست فرستاده شد.");
      setRequesting(false);
    } catch (e) {
      if (e instanceof ApiError && e.code === "IDENTITY_REQUIRED") {
        setRequesting(false);
        setNeedIdentity(true);
      } else toast.error(errorMessage(e instanceof ApiError ? e.code : undefined));
    }
    setBusy(false);
  }
  async function addNote() {
    if (!myPending) return;
    setBusy(true);
    const res = await mutate(
      () => api(`/copies/${c.id}/passport`, { method: "POST", body: { loanId: myPending.loanId, note } }),
      "یادداشتت در پاسپورت کتاب ثبت شد.",
    );
    setBusy(false);
    if (res) {
      setNote("");
      void passport.reload();
      void pending.reload();
    }
  }

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        {/* Left: cover + primary action */}
        <div className="mx-auto w-full max-w-[260px] lg:sticky lg:top-24 lg:max-w-none lg:self-start">
          <div className="relative">
            <BookCover title={c.edition.title} author={c.edition.authors[0]} coverUrl={c.edition.coverUrl} className="w-full" />
            <HeartButton editionId={c.edition.id} className="absolute start-3 top-3" />
          </div>
          {!isOwner && c.status === "AVAILABLE" && (
            <Button className="mt-5 h-12 w-full text-base" variant="accent" onClick={() => setRequesting(true)}>
              <Send size={18} /> درخواست امانت
            </Button>
          )}
        </div>

        {/* Right: details + passport */}
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold leading-snug lg:text-4xl">{c.edition.title}</h1>
          <p className="mt-1 text-muted-foreground">{c.edition.authors.join("، ")}</p>
          {c.edition.publisher && <p className="text-sm text-muted-foreground">{c.edition.publisher}</p>}
          <div className="mt-4 flex flex-wrap gap-1.5">
            <Badge tone={c.status === "AVAILABLE" ? "success" : "neutral"}>{COPY_STATUS_LABEL[c.status]}</Badge>
            <Badge tone="primary">{CONDITION_LABEL[c.condition]}</Badge>
            {c.edition.genres.map((g) => (
              <Badge key={g}>{g}</Badge>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-card/80 p-3 shadow-paper">
            <Avatar id={c.owner.avatarId} size={44} />
            <div className="flex-1">
              <div className="text-end font-bold">{displayName(c.owner)}</div>
              <div className="text-xs text-muted-foreground">
                امتیاز اعتماد {toFaDigits(c.owner.trustScore)} · {toFaDigits(c.owner.karmaTokens)} اعتبار
              </div>
            </div>
            <TrustRing value={c.owner.trustScore} size={44} />
          </div>
          {c.edition.isbn && (
            <p dir="ltr" className="mt-3 text-end text-xs text-muted-foreground">
              ISBN {c.edition.isbn}
            </p>
          )}
          {c.ownerNotes && <p className="mt-4 rounded-xl bg-muted p-3 text-sm">یادداشت صاحب کتاب: {c.ownerNotes}</p>}

          <section id="passport" className="mt-8 scroll-mt-24 rounded-3xl border border-violet-500/20 bg-violet-500/5 p-5">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-violet-700 dark:text-violet-300">
              <BookMarked size={20} /> پاسپورت کتاب
            </h2>
            <p className="mb-5 text-xs text-muted-foreground">سفر این نسخه از دست‌به‌دست شدن‌ها و خاطره‌های خواننده‌هایش</p>

            {myPending && (
              <div className="mb-5 rounded-2xl border border-violet-500/30 bg-card p-3">
                <Label>خاطره‌ات از این کتاب را در یک جمله بنویس</Label>
                <Textarea
                  maxLength={PASSPORT_NOTE_MAX}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="شبی که تا صبح بیدارم نگه داشت."
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {toFaDigits(note.length)}/{toFaDigits(PASSPORT_NOTE_MAX)}
                  </span>
                  <Button size="sm" disabled={busy || !note.trim()} onClick={addNote}>
                    ثبت در پاسپورت
                  </Button>
                </div>
              </div>
            )}
            {passport.data && passport.data.entries.length === 0 && (
              <p className="mb-4 text-sm text-muted-foreground">هنوز کسی خاطره‌ای ثبت نکرده؛ اولین خواننده باش!</p>
            )}
            {passport.loading ? <Skeleton className="h-24" /> : passport.data ? <PassportTimelineView data={passport.data} /> : null}
          </section>
        </div>
      </div>

      <IdentitySheet open={needIdentity} onOpenChange={setNeedIdentity} onDone={() => setRequesting(true)} />

      <Sheet
        open={requesting}
        onOpenChange={setRequesting}
        title="درخواست امانت"
        description={`«${c.edition.title}» از ${displayName(c.owner)}`}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void request();
          }}
        >
          <div>
            <Label>تا چه تاریخی برمی‌گردانی؟</Label>
            <Input type="date" dir="ltr" value={due} min={isoDateInput(1)} onChange={(e) => setDue(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">با تایید صاحب کتاب، یک اعتبار امانت تا برگشت کتاب قفل می‌شود.</p>
          <Button className="w-full" disabled={busy || !due}>
            ارسال درخواست
          </Button>
        </form>
      </Sheet>
    </>
  );
}
