"use client";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { toast as sonner } from "sonner";
import type { ReactNode } from "react";

type Kind = "error" | "success" | "info";
const DURATION = 4500;

const STYLE: Record<Kind, { bg: string; glow: string; icon: ReactNode }> = {
  error: {
    bg: "linear-gradient(135deg,#f43f5e 0%,#be123c 60%,#881337 100%)",
    glow: "rgba(244,63,94,.45)",
    icon: <AlertCircle size={22} />,
  },
  success: {
    bg: "linear-gradient(135deg,#10b981 0%,#0f766e 65%,#134e4a 100%)",
    glow: "rgba(16,185,129,.45)",
    icon: <CheckCircle2 size={22} />,
  },
  info: { bg: "linear-gradient(135deg,#8b5cf6 0%,#4f46e5 65%,#312e81 100%)", glow: "rgba(99,102,241,.45)", icon: <Info size={22} /> },
};

function Card({ kind, message, onClose }: { kind: Kind; message: string; onClose: () => void }) {
  const s = STYLE[kind];
  return (
    <div
      dir="rtl"
      role={kind === "error" ? "alert" : "status"}
      onClick={onClose}
      className="relative flex w-fit min-w-[280px] max-w-[92vw] cursor-pointer items-center gap-3 overflow-hidden rounded-2xl px-4 py-3.5 font-sans text-white ring-1 ring-white/25"
      style={{ backgroundImage: s.bg, boxShadow: `0 18px 40px -12px ${s.glow}, 0 4px 12px rgba(0,0,0,.25)` }}
    >
      <span className="pointer-events-none absolute -start-6 -top-8 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
        {s.icon}
      </span>
      <p className="relative text-[15px] font-bold leading-7">{message}</p>
      <span
        className="absolute inset-x-0 bottom-0 h-1 origin-right bg-white/60"
        style={{ animation: `toast-progress ${DURATION}ms linear forwards` }}
      />
    </div>
  );
}

const show = (kind: Kind) => (message: string) =>
  sonner.custom((id) => <Card kind={kind} message={message} onClose={() => sonner.dismiss(id)} />, { duration: DURATION });

/** App-wide toast API (drop-in for sonner's `toast.error / success / info`). */
export const toast = { error: show("error"), success: show("success"), info: show("info") };
