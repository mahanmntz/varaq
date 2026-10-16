import { cn } from "@/lib/utils";

/** Rich fallback palettes (from → to) so covers without an image still look like real books. */
const GRADIENTS = [
  ["#0f766e", "#064e3b"],
  ["#7c3aed", "#312e81"],
  ["#b45309", "#78350f"],
  ["#be123c", "#4c0519"],
  ["#0369a1", "#082f49"],
  ["#4d7c0f", "#1a2e05"],
  ["#a21caf", "#4a044e"],
  ["#c2410c", "#431407"],
];

const hash = (s: string) => [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);

/**
 * 2:3 book cover with a 3D look: spine shadow on the binding side (right in RTL), a soft
 * highlight and rounded outer corners. Falls back to a gradient cover with typography.
 */
export function BookCover({
  title,
  author,
  coverUrl,
  className,
}: {
  title: string;
  author?: string;
  coverUrl?: string | null;
  className?: string;
}) {
  const [from, to] = GRADIENTS[hash(title) % GRADIENTS.length];
  const size = title.length > 22 ? "text-[0.8em]" : title.length > 12 ? "text-[0.95em]" : "text-[1.15em]";
  return (
    <div
      className={cn(
        "relative aspect-[2/3] shrink-0 overflow-hidden rounded-e-md rounded-s-[3px] text-[clamp(10px,2.6cqw,15px)] shadow-[0_14px_24px_-10px_rgba(0,0,0,0.55),0_2px_4px_rgba(0,0,0,0.25)] [container-type:inline-size]",
        className,
      )}
      style={coverUrl ? undefined : { backgroundImage: `linear-gradient(155deg, ${from}, ${to})` }}
      role="img"
      aria-label={`جلد ${title}`}
    >
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-between px-[14%] py-[12%] text-center text-white">
          <div className="h-px w-1/3 bg-white/50" />
          <div>
            <p className={cn("font-extrabold leading-snug drop-shadow", size)} style={{ fontSize: "clamp(11px, 9cqw, 22px)" }}>
              {title}
            </p>
            <div className="mx-auto my-[0.6em] h-[2px] w-6 rounded bg-amber-300/80" />
            {author && (
              <p className="line-clamp-2 text-white/80" style={{ fontSize: "clamp(8px, 5.5cqw, 13px)" }}>
                {author}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            <span className="h-1 w-1 rounded-full bg-white/60" />
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span className="h-1 w-1 rounded-full bg-white/60" />
          </div>
        </div>
      )}
      {/* spine: dark crease + highlight on the binding edge */}
      <div className="pointer-events-none absolute inset-y-0 start-0 w-[9%] bg-gradient-to-l from-transparent via-black/15 to-black/35" />
      <div className="pointer-events-none absolute inset-y-0 start-[9%] w-px bg-white/25" />
      {/* soft sheen */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/15" />
    </div>
  );
}
