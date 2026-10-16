"use client";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "@/lib/notify";
import { AddBookSheet } from "@/components/add-book-sheet";

export const LIBRARY_CHANGED = "varaq:library-changed";
const Ctx = createContext<{ openAddBook: () => void } | null>(null);

/** Hosts the add-book sheet so any page or the top bar can open it. */
export function AddBookProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { me } = useAuth();
  const router = useRouter();
  /** Adding books requires a verified identity. */
  const openAddBook = () => {
    if (me && !me.identityVerified) {
      toast.info("برای افزودن کتاب اول احراز هویت کن.");
      router.push("/verify");
      return;
    }
    setOpen(true);
  };
  return (
    <Ctx.Provider value={{ openAddBook }}>
      {children}
      <AddBookSheet open={open} onOpenChange={setOpen} onAdded={() => window.dispatchEvent(new Event(LIBRARY_CHANGED))} />
    </Ctx.Provider>
  );
}
export const useAddBook = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAddBook outside AddBookProvider");
  return v;
};
