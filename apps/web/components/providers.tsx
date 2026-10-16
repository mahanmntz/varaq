"use client";
import { useEffect, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        {children}
        <Toaster position="top-center" dir="rtl" toastOptions={{ unstyled: true }} />
      </AuthProvider>
    </MotionConfig>
  );
}
