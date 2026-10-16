"use client";
import { isValidIsbn, normalizeIsbn, type BookCondition } from "@varaq/shared";
import { Keyboard, PenLine, ScanBarcode } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "@/lib/notify";
import { BookCover } from "@/components/book-cover";
import { Scanner } from "@/components/scanner";
import { Button } from "@/components/ui/button";
import { ConditionPicker } from "@/components/ui/condition-picker";
import { Input, Label } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { ApiError, api } from "@/lib/api";
import { errorMessage } from "@/lib/labels";
import type { BookLookup, Copy } from "@/lib/types";
import { mutate } from "@/lib/use-api";
import { cn } from "@/lib/utils";

type Mode = "scan" | "isbn" | "manual";
type Draft = { isbn?: string; title: string; authors: string; publisher: string; coverUrl?: string | null };

const emptyDraft: Draft = { title: "", authors: "", publisher: "" };

export function AddBookSheet({ open, onOpenChange, onAdded }: { open: boolean; onOpenChange: (o: boolean) => void; onAdded: () => void }) {
  const [mode, setMode] = useState<Mode>("scan");
  const [isbnInput, setIsbnInput] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null); // set once a book is identified
  const [fromLookup, setFromLookup] = useState(false);
  const [condition, setCondition] = useState<BookCondition>("GOOD");
  const [available, setAvailable] = useState(true);
  const [busy, setBusy] = useState(false);
  const looking = useRef(false);

  const reset = () => {
    setDraft(null);
    setIsbnInput("");
    setCondition("GOOD");
    setAvailable(true);
    setFromLookup(false);
  };

  async function lookup(raw: string) {
    const isbn = normalizeIsbn(raw);
    if (looking.current) return;
    if (!isValidIsbn(isbn)) return toast.error("این بارکد شابک کتاب نیست. بارکدی را بخوان که زیرش عدد ۹۷۸… نوشته شده.");
    looking.current = true;
    setBusy(true);
    try {
      const b = await api<BookLookup>(`/books/isbn/${isbn}`);
      setDraft({ isbn, title: b.title, authors: b.authors.join("، "), publisher: b.publisher ?? "", coverUrl: b.coverUrl });
      setFromLookup(true);
    } catch (e) {
      toast.error(errorMessage(e instanceof ApiError ? e.code : undefined));
      setDraft({ ...emptyDraft, isbn });
      setMode("manual");
    } finally {
      looking.current = false;
      setBusy(false);
    }
  }

  async function save() {
    if (!draft) return;
    setBusy(true);
    const authors = draft.authors
      .split(/[،,]/)
      .map((a) => a.trim())
      .filter(Boolean);
    const body =
      fromLookup && draft.isbn
        ? { isbn: draft.isbn, condition, status: available ? "AVAILABLE" : "UNAVAILABLE" }
        : {
            manual: { title: draft.title.trim(), authors, publisher: draft.publisher.trim() || undefined, isbn: draft.isbn },
            condition,
            status: available ? "AVAILABLE" : "UNAVAILABLE",
          };
    const res = await mutate(() => api<Copy>("/copies", { method: "POST", body }), "کتاب به قفسه‌ات اضافه شد.");
    setBusy(false);
    if (res) {
      reset();
      onOpenChange(false);
      onAdded();
    }
  }

  const tabs: { id: Mode; label: string; icon: typeof ScanBarcode }[] = [
    { id: "scan", label: "اسکن بارکد", icon: ScanBarcode },
    { id: "isbn", label: "شابک", icon: Keyboard },
    { id: "manual", label: "ورود دستی", icon: PenLine },
  ];
  const canSave = draft && draft.title.trim().length > 0 && (fromLookup || draft.authors.trim().length > 0);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      title="افزودن کتاب به قفسه"
    >
      {!draft || !fromLookup ? (
        <>
          <div className="mb-4 grid grid-cols-3 gap-1 rounded-md bg-muted p-1" role="tablist">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={mode === id}
                onClick={() => {
                  setMode(id);
                  if (id !== "manual") setDraft(null);
                  else setDraft((d) => d ?? emptyDraft);
                }}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-sm py-2 text-xs",
                  mode === id ? "bg-card font-bold shadow-sm" : "text-muted-foreground",
                )}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {mode === "scan" && <Scanner onDetect={lookup} />}

          {mode === "isbn" && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void lookup(isbnInput);
              }}
            >
              <div>
                <Label>شابک (ISBN)</Label>
                <Input
                  dir="ltr"
                  inputMode="numeric"
                  autoFocus
                  placeholder="978…"
                  value={isbnInput}
                  onChange={(e) => setIsbnInput(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled={busy || isbnInput.length < 10}>
                {busy ? "در حال جستجو…" : "جستجوی کتاب"}
              </Button>
            </form>
          )}

          {mode === "manual" && draft && (
            <div className="space-y-3">
              <div>
                <Label>عنوان</Label>
                <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </div>
              <div>
                <Label>نویسنده (با ویرگول فارسی جدا کنید)</Label>
                <Input value={draft.authors} onChange={(e) => setDraft({ ...draft, authors: e.target.value })} />
              </div>
              <div>
                <Label>ناشر (اختیاری)</Label>
                <Input value={draft.publisher} onChange={(e) => setDraft({ ...draft, publisher: e.target.value })} />
              </div>
              <div>
                <Label>شابک (اختیاری)</Label>
                <Input dir="ltr" value={draft.isbn ?? ""} onChange={(e) => setDraft({ ...draft, isbn: e.target.value || undefined })} />
              </div>
              <Details condition={condition} setCondition={setCondition} available={available} setAvailable={setAvailable} />
              <Button className="w-full" disabled={busy || !canSave} onClick={save}>
                افزودن به قفسه
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-3">
            <BookCover title={draft.title} author={draft.authors} coverUrl={draft.coverUrl} className="w-24" />
            <div>
              <h3 className="font-bold">{draft.title}</h3>
              <p className="text-sm text-muted-foreground">{draft.authors}</p>
              {draft.publisher && <p className="text-xs text-muted-foreground">{draft.publisher}</p>}
              <button className="mt-2 text-xs text-accent-ink underline" onClick={reset}>
                کتاب دیگر
              </button>
            </div>
          </div>
          <Details condition={condition} setCondition={setCondition} available={available} setAvailable={setAvailable} />
          <Button className="w-full" disabled={busy} onClick={save}>
            افزودن به قفسه
          </Button>
        </div>
      )}
    </Sheet>
  );
}

function Details(p: {
  condition: BookCondition;
  setCondition: (c: BookCondition) => void;
  available: boolean;
  setAvailable: (a: boolean) => void;
}) {
  return (
    <>
      <div>
        <Label>وضعیت فیزیکی این نسخه</Label>
        <ConditionPicker value={p.condition} onChange={p.setCondition} />
      </div>
      <label className="flex items-center gap-3 rounded-md border border-border bg-card p-3 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 accent-[hsl(var(--primary))]"
          checked={p.available}
          onChange={(e) => p.setAvailable(e.target.checked)}
        />
        <span>
          برای امانت دادن آماده است <span className="text-xs text-muted-foreground">(با ۲ کتاب آماده، یک اعتبار امانت هدیه می‌گیری)</span>
        </span>
      </label>
    </>
  );
}
