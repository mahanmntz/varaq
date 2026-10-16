"use client";
import { Copy as CopyIcon, MapPin, Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "@/lib/notify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { toFaDigits } from "@/lib/format";
import type { Circle } from "@/lib/types";
import { mutate, useApi } from "@/lib/use-api";

export default function CirclesPage() {
  const mine = useApi<Circle[]>("/circles/mine");
  const discover = useApi<Circle[]>("/circles");
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", isPublic: false });
  const [busy, setBusy] = useState(false);

  const reload = () => {
    void mine.reload();
    void discover.reload();
  };

  async function join(body: { inviteCode?: string; circleId?: string }) {
    const res = await mutate(() => api("/circles/join", { method: "POST", body }), "به حلقه پیوستی.");
    if (res) {
      setCode("");
      reload();
    }
  }
  async function leave(c: Circle) {
    await mutate(() => api(`/circles/${c.id}/membership`, { method: "DELETE" }), "از حلقه خارج شدی.");
    reload();
  }
  async function create() {
    setBusy(true);
    const res = await mutate(() => api("/circles", { method: "POST", body: form }), "حلقه ساخته شد.");
    setBusy(false);
    if (res) {
      setCreating(false);
      setForm({ name: "", city: "", isPublic: false });
      reload();
    }
  }
  const copyCode = async (c: string) => {
    try {
      await navigator.clipboard.writeText(c);
      toast.success("کد دعوت کپی شد.");
    } catch {
      toast.error("کپی نشد.");
    }
  };

  const open = discover.data?.filter((c) => !c.isMember) ?? [];

  return (
    <>
      <PageHeader
        title="حلقه‌ها و پاتوق‌ها"
        subtitle="اختیاری: برای فیلتر کردن کتاب‌های اطرافیان (دانشگاه، کافه، جمع دوستان)"
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus size={16} /> حلقه جدید
          </Button>
        }
      />

      <form
        className="flex max-w-xl gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void join({ inviteCode: code });
        }}
      >
        <Input placeholder="کد دعوت" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        <Button disabled={code.length < 4}>پیوستن</Button>
      </form>

      <h2 className="mb-2 mt-6 text-sm font-bold text-muted-foreground">حلقه‌های من</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mine.loading && <Skeleton className="h-20" />}
        {mine.data?.length === 0 && (
          <EmptyState icon={<Users size={30} />} title="هنوز عضو حلقه‌ای نیستی" hint="با کد دعوت یا از فهرست زیر به یک حلقه بپیوند." />
        )}
        {mine.data?.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold">{c.name}</h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin size={12} /> {c.city} · {toFaDigits(c.memberCount)} عضو
                </p>
              </div>
              <Badge tone={c.isPublic ? "success" : "neutral"}>{c.isPublic ? "عمومی" : "خصوصی"}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between">
              {c.inviteCode && (
                <button
                  onClick={() => copyCode(c.inviteCode!)}
                  className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs"
                  aria-label="کپی کد دعوت"
                >
                  <CopyIcon size={13} /> کد دعوت: <b dir="ltr">{c.inviteCode}</b>
                </button>
              )}
              <Button size="sm" variant="ghost" onClick={() => leave(c)}>
                خروج
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {open.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 text-sm font-bold text-muted-foreground">حلقه‌های عمومی</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {open.map((c) => (
              <Card key={c.id} className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{c.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {c.city} · {toFaDigits(c.memberCount)} عضو
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => join({ circleId: c.id })}>
                  پیوستن
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}

      <Sheet
        open={creating}
        onOpenChange={setCreating}
        title="ساخت حلقه یا پاتوق"
        description="آدرس دقیق نگذار؛ فقط نام مکان یا گروه و شهر کافی است."
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void create();
          }}
        >
          <div>
            <Label>نام</Label>
            <Input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="کافه نزدیک مترو" />
          </div>
          <div>
            <Label>شهر</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="تهران" />
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={form.isPublic}
              onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
            />{" "}
            حلقه عمومی باشد (همه بتوانند بپیوندند)
          </label>
          <Button className="w-full" disabled={busy || form.name.trim().length < 2 || form.city.trim().length < 2}>
            ساختن
          </Button>
        </form>
      </Sheet>
    </>
  );
}
