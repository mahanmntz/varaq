"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "@/lib/notify";
import { api } from "./api";
import { useAuth } from "./auth";

type Ctx = { has: (editionId: string) => boolean; toggle: (editionId: string) => Promise<void>; count: number };
const WishlistCtx = createContext<Ctx | null>(null);

/** Bookmarked editions with optimistic toggling. */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!me) return;
    api<{ editionIds: string[] }>("/wishlist/ids")
      .then((r) => setIds(new Set(r.editionIds)))
      .catch(() => {});
  }, [me]);

  const toggle = useCallback(
    async (editionId: string) => {
      const wasOn = ids.has(editionId);
      const apply = (on: boolean) =>
        setIds((prev) => {
          const n = new Set(prev);
          if (on) n.add(editionId);
          else n.delete(editionId);
          return n;
        });
      apply(!wasOn);
      try {
        await api(`/wishlist/${editionId}`, { method: wasOn ? "DELETE" : "PUT" });
        if (!wasOn) toast.success("به علاقه‌مندی‌ها اضافه شد.");
      } catch {
        apply(wasOn);
        toast.error("ذخیره نشد؛ دوباره امتحان کن.");
      }
    },
    [ids],
  );

  const value = useMemo(() => ({ has: (id: string) => ids.has(id), toggle, count: ids.size }), [ids, toggle]);
  return <WishlistCtx.Provider value={value}>{children}</WishlistCtx.Provider>;
}

export function useWishlist() {
  const v = useContext(WishlistCtx);
  if (!v) throw new Error("useWishlist outside WishlistProvider");
  return v;
}
