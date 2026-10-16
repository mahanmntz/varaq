import { displayName } from "@/lib/format";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { BookCover } from "@/components/book-cover";
import { HeartButton } from "@/components/heart-button";
import { CONDITION_LABEL } from "@/lib/labels";
import type { Copy } from "@/lib/types";

const CONDITION_TONE = { MINT: "bg-emerald-500", GOOD: "bg-sky-500", FAIR: "bg-amber-500", WORN: "bg-stone-500" } as const;

/** Vertical catalogue card: 3D cover, condition pill, wishlist heart and lender footer. */
export function BookCard({ copy }: { copy: Copy }) {
  const { edition, owner } = copy;
  return (
    <Link
      href={`/books/${copy.id}`}
      className="group block rounded-2xl border border-border/60 bg-card/80 p-3 shadow-paper backdrop-blur transition duration-300 hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_24px_40px_-20px_hsl(var(--foreground)/0.45)]"
    >
      <div className="relative">
        <BookCover title={edition.title} author={edition.authors[0]} coverUrl={edition.coverUrl} className="w-full" />
        <span
          className={`absolute bottom-2 end-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow ${CONDITION_TONE[copy.condition]}`}
        >
          {CONDITION_LABEL[copy.condition]}
        </span>
        <HeartButton editionId={edition.id} className="absolute start-2 top-2" />
      </div>
      <h3 className="mt-3 line-clamp-1 font-bold leading-snug">{edition.title}</h3>
      <p className="line-clamp-1 text-xs text-muted-foreground">{edition.authors[0]}</p>
      <div className="mt-2.5 flex items-center gap-1.5 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
        <Avatar id={owner.avatarId} size={22} />
        <span className="truncate font-medium text-foreground/80">{displayName(owner)}</span>
      </div>
    </Link>
  );
}
