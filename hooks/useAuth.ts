"use client";

import { useEffect, useState } from "react";
import { AUTH_KEY, AUTH_TTL_MS, LOGIN_PASSWORD, LOGIN_USER } from "@/lib/constants";
import { StoredAuth } from "@/lib/types";

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(true);

  useEffect(() => {
    const raw = window.localStorage.getItem(AUTH_KEY) || window.sessionStorage.getItem(AUTH_KEY);

    if (!raw) {
      return;
    }

    try {
      const session = JSON.parse(raw) as StoredAuth;
      const valid = session.user === LOGIN_USER && session.expiresAt > Date.now();
      setAuthenticated(valid);
      if (!valid) {
        window.localStorage.removeItem(AUTH_KEY);
        window.sessionStorage.removeItem(AUTH_KEY);
      }
    } catch {
      window.localStorage.removeItem(AUTH_KEY);
      window.sessionStorage.removeItem(AUTH_KEY);
    }
  }, []);

  function login(user: string, password: string) {
    const valid = user.trim().toLowerCase() === LOGIN_USER && password.trim() === LOGIN_PASSWORD;
    if (!valid) return false;

    const session: StoredAuth = {
      user: LOGIN_USER,
      expiresAt: Date.now() + AUTH_TTL_MS
    };

    try {
      window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    } catch {
      try {
        window.sessionStorage.setItem(AUTH_KEY, JSON.stringify(session));
      } catch {
        // Login still works for the current render even if storage is blocked.
      }
    }
    setAuthenticated(true);
    return true;
  }

  function logout() {
    try {
      window.localStorage.removeItem(AUTH_KEY);
      window.sessionStorage.removeItem(AUTH_KEY);
    } catch {
      // Ignore storage errors on restricted mobile browsers.
    }
    setAuthenticated(false);
  }

  return { authenticated, ready, login, logout };
}
