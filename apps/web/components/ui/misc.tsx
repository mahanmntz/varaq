import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Card = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cn("rounded-lg border border-border bg-card p-4 shadow-paper", className)}>{children}</div>
);

export const Skeleton = ({ className }: { className?: string }) => <div className={cn("animate-pulse rounded-md bg-muted", className)} />;

export function EmptyState({ icon, title, hint, children }: { icon?: ReactNode; title: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-6 py-12 text-center">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <p className="font-bold">{title}</p>
      {hint && <p className="max-w-xs text-sm text-muted-foreground">{hint}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight lg:text-3xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
