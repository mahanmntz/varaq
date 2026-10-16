"use client";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import Link from "next/link";
import { BookCard } from "@/components/book-card";
import { BookCover } from "@/components/book-cover";
import { HeartButton } from "@/components/heart-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";
import type { WishlistEntry } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { useWishlist } from "@/lib/wishlist";

export default function WishlistPage() {
  const { has } = useWishlist();
  const list = useApi<WishlistEntry[]>("/wishlist");
  const items = (list.data ?? []).filter((w) => has(w.edition.id));

  return (
    <>
      <PageHeader title="علاقه‌مندی‌ها" subtitle="کتاب‌هایی که می‌خواهی بخوانی؛ هر وقت آماده امانت شدند، سراغشان برو" />
      {list.loading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-[2/3.6]" />
          ))}
        </div>
      )}
      {!list.loading && items.length === 0 && (
        <EmptyState icon={<Heart size={34} />} title="هنوز کتابی را نشان نکرده‌ای" hint="روی قلب کتاب‌ها بزن تا اینجا جمع شوند.">
          <Link href="/">
            <Button>کشف کتاب‌ها</Button>
          </Link>
        </EmptyState>
      )}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4"
      >
        {items.map((w) => (
          <motion.div key={w.edition.id} variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}>
            {w.availableCopy ? (
              <BookCard copy={w.availableCopy} />
            ) : (
              <div className="rounded-2xl border border-border/60 bg-card/80 p-3 shadow-paper">
                <div className="relative opacity-70 grayscale-[40%]">
                  <BookCover title={w.edition.title} author={w.edition.authors[0]} coverUrl={w.edition.coverUrl} className="w-full" />
                  <HeartButton editionId={w.edition.id} className="absolute start-2 top-2" />
                </div>
                <h3 className="mt-3 line-clamp-1 font-bold">{w.edition.title}</h3>
                <p className="line-clamp-1 text-xs text-muted-foreground">{w.edition.authors[0]}</p>
                <div className="mt-2">
                  <Badge>فعلاً موجود نیست</Badge>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}
