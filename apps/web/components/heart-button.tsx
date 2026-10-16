"use client";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

/** Wishlist toggle with a spring "pop". Safe to nest inside a link (stops navigation). */
export function HeartButton({ editionId, className }: { editionId: string; className?: string }) {
  const { has, toggle } = useWishlist();
  const on = has(editionId);
  return (
    <motion.button
      type="button"
      aria-pressed={on}
      aria-label={on ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      whileTap={{ scale: 0.8 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle(editionId);
      }}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/55",
        on && "bg-white/90 text-rose-500 hover:bg-white",
        className,
      )}
    >
      <motion.span
        key={String(on)}
        initial={{ scale: 0.4 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 12 }}
        className="flex"
      >
        <Heart size={18} fill={on ? "currentColor" : "none"} />
      </motion.span>
    </motion.button>
  );
}
