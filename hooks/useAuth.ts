"use client";

import { useEffect, useState } from "react";
import { AUTH_KEY, LOGIN_PASSWORD, LOGIN_USER, TTL_MS } from "@/lib/constants";
import { StoredAuth } from "@/lib/types";

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(true);

  useEffect(() => {
    const raw = window.localStorage.getItem(AUTH_KEY);

    if (!raw) {
      return;
    }

    try {
      const session = JSON.parse(raw) as StoredAuth;
      const valid = session.user === LOGIN_USER && session.expiresAt > Date.now();
      setAuthenticated(valid);
      if (!valid) window.localStorage.removeItem(AUTH_KEY);
    } catch {
      window.localStorage.removeItem(AUTH_KEY);
    }
  }, []);

  function login(user: string, password: string) {
    const valid = user.trim() === LOGIN_USER && password === LOGIN_PASSWORD;
    if (!valid) return false;

    const session: StoredAuth = {
      user: LOGIN_USER,
      expiresAt: Date.now() + TTL_MS
    };

    try {
      window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    } catch {
      window.alert("Nao foi possivel salvar a sessao neste navegador.");
    }
    setAuthenticated(true);
    return true;
  }

  function logout() {
    try {
      window.localStorage.removeItem(AUTH_KEY);
    } catch {
      // Ignore storage errors on restricted mobile browsers.
    }
    setAuthenticated(false);
  }

  return { authenticated, ready, login, logout };
}
