"use client";

import { FormEvent, useState } from "react";
import { Lock, User } from "lucide-react";
import { DigaspiLogo } from "@/components/brand/DigaspiLogo";

type Props = {
  onLogin: (user: string, password: string) => boolean;
};

export function LoginScreen({ onLogin }: Props) {
  const [user, setUser] = useState("estoque.l41");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = onLogin(user, password);
    setError(ok ? "" : "Usuario ou senha invalidos.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-sm">
        <div className="flex justify-center">
          <DigaspiLogo />
        </div>

        <form onSubmit={submit} className="mt-7 rounded-lg border border-digaspi-line bg-white p-5 shadow-panel">
          <h1 className="text-center text-xl font-black text-digaspi-ink">Estoque L41</h1>

          <label className="mt-5 block">
            <span className="mb-1 block text-sm font-bold text-slate-700">Usuario</span>
            <span className="flex h-12 items-center gap-2 rounded-md border border-digaspi-line px-3">
              <User className="h-5 w-5 text-digaspi-blue" />
              <input
                className="h-full min-w-0 flex-1 outline-none"
                value={user}
                onChange={(event) => setUser(event.target.value)}
                autoComplete="username"
              />
            </span>
          </label>

          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-bold text-slate-700">Senha</span>
            <span className="flex h-12 items-center gap-2 rounded-md border border-digaspi-line px-3">
              <Lock className="h-5 w-5 text-digaspi-blue" />
              <input
                className="h-full min-w-0 flex-1 outline-none"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </span>
          </label>

          {error ? <p className="mt-3 rounded-md bg-red-50 p-3 text-sm font-bold text-digaspi-red">{error}</p> : null}

          <button className="mt-5 h-12 w-full rounded-md bg-digaspi-blue font-black text-white" type="submit">
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
