import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium", {
  variants: {
    tone: {
      neutral: "bg-muted text-muted-foreground",
      primary: "bg-primary/10 text-primary",
      accent: "bg-accent/15 text-accent-ink",
      success: "bg-success/15 text-success",
      danger: "bg-danger/15 text-danger",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({ tone, className, children }: VariantProps<typeof badge> & { className?: string; children: React.ReactNode }) {
  return <span className={cn(badge({ tone }), className)}>{children}</span>;
}
