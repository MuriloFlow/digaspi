"use client";

import { useEffect, useState } from "react";
import { AUTH_KEY, LOGIN_PASSWORD, LOGIN_USER, TTL_MS } from "@/lib/constants";
import { StoredAuth } from "@/lib/types";

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(AUTH_KEY);

    if (!raw) {
      setReady(true);
      return;
    }

    try {
      const session = JSON.parse(raw) as StoredAuth;
      const valid = session.user === LOGIN_USER && session.expiresAt > Date.now();
      setAuthenticated(valid);
      if (!valid) window.localStorage.removeItem(AUTH_KEY);
    } catch {
      window.localStorage.removeItem(AUTH_KEY);
    } finally {
      setReady(true);
    }
  }, []);

  function login(user: string, password: string) {
    const valid = user.trim() === LOGIN_USER && password === LOGIN_PASSWORD;
    if (!valid) return false;

    const session: StoredAuth = {
      user: LOGIN_USER,
      expiresAt: Date.now() + TTL_MS
    };

    window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    setAuthenticated(true);
    return true;
  }

  function logout() {
    window.localStorage.removeItem(AUTH_KEY);
    setAuthenticated(false);
  }

  return { authenticated, ready, login, logout };
}
