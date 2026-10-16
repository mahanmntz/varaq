"use client";
import { animate } from "framer-motion";
import { useEffect, useState } from "react";

/** Animated Persian-digit counter. */
export function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const c = animate(0, value, { duration: 1.1, ease: "easeOut", onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [value]);
  return <>{new Intl.NumberFormat("fa-IR").format(n)}</>;
}
