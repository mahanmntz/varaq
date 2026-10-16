"use client";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/misc";
import { useAuth } from "@/lib/auth";
import { WishlistProvider } from "@/lib/wishlist";

/** Authenticated area: redirects to /login, then renders the responsive shell. */
export default function AppLayout({ children }: { children: ReactNode }) {
  const { me, ready } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (ready && !me) router.replace("/login");
  }, [ready, me, router]);

  if (!ready || !me)
    return (
      <div className="mx-auto max-w-5xl space-y-3 p-6">
        <Skeleton className="h-14" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  return (
    <WishlistProvider>
      <AppShell>{children}</AppShell>
    </WishlistProvider>
  );
}
