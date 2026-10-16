"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "@/lib/notify";
import { ApiError, api } from "./api";
import { errorMessage } from "./labels";

/** Fetches `path` (skipped when null) and exposes reload. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (path === null) return;
    try {
      setData(await api<T>(path));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.code : "UNKNOWN");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    setLoading(path !== null);
    void load();
  }, [load, path]);

  return { data, loading, error, reload: load };
}

/** Runs an API mutation, shows a Persian toast on failure and returns undefined. */
export async function mutate<T>(fn: () => Promise<T>, success?: string): Promise<T | undefined> {
  try {
    const out = await fn();
    if (success) toast.success(success);
    return out;
  } catch (e) {
    toast.error(errorMessage(e instanceof ApiError ? e.code : undefined));
    return undefined;
  }
}
