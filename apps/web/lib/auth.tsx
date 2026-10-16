"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, tokenStore } from "./api";
import type { Me } from "./types";

type AuthState = {
  me: Me | null;
  ready: boolean;
  refresh: () => Promise<void>;
  login: (token: string, me: Me) => void;
  logout: () => void;
};
const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      setMe(null);
      return;
    }
    try {
      setMe(await api<Me>("/users/me"));
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    void refresh().finally(() => setReady(true));
  }, [refresh]);

  const value: AuthState = {
    me,
    ready,
    refresh,
    login: (token, user) => {
      tokenStore.set(token);
      setMe(user);
    },
    logout: () => {
      tokenStore.clear();
      setMe(null);
      window.location.href = "/login";
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
