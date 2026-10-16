"use client";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Six animated digit boxes (LTR) with auto-advance, backspace and paste support. */
export function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const setAt = (i: number, digit: string) => {
    const chars = value.padEnd(length, " ").split("");
    chars[i] = digit || " ";
    onChange(chars.join("").replace(/ /g, "").slice(0, length));
  };

  return (
    <div dir="ltr" className="flex justify-center gap-2" role="group" aria-label="کد ۶ رقمی">
      {Array.from({ length }, (_, i) => {
        const filled = !!value[i];
        return (
          <motion.input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            placeholder="•"
            value={value[i] ?? ""}
            animate={{ scale: filled ? [1, 1.12, 1] : 1 }}
            transition={{ duration: 0.18 }}
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, "").slice(-1);
              setAt(i, d);
              if (d && i < length - 1) refs.current[i + 1]?.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
              if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
              if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
              if (text) {
                e.preventDefault();
                onChange(text);
                refs.current[Math.min(text.length, length - 1)]?.focus();
              }
            }}
            className={cn(
              "h-14 w-11 rounded-xl border-2 bg-card text-center text-2xl font-extrabold outline-none transition-colors placeholder:text-muted-foreground/50 sm:w-12",
              filled ? "border-primary text-primary" : "border-border focus:border-primary/60",
            )}
          />
        );
      })}
    </div>
  );
}
