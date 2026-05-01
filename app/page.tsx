"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { HomeMenu, ViewKey } from "@/components/home/HomeMenu";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { ReceiptModule } from "@/components/recebimento/ReceiptModule";
import { PullModule } from "@/components/puxada/PullModule";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const auth = useAuth();
  const [view, setView] = useState<ViewKey>("menu");

  if (!auth.ready) return <main className="min-h-screen bg-digaspi-pale" />;

  if (!auth.authenticated) {
    return <LoginScreen onLogin={auth.login} />;
  }

  return (
    <main className="min-h-screen pb-6">
      <AppHeader currentView={view} onBack={() => setView("menu")} onLogout={auth.logout} />
      <div className="mx-auto max-w-3xl px-4 py-4">
        {view === "menu" ? <HomeMenu onOpen={setView} /> : null}
        {view === "recebimento" ? <ReceiptModule /> : null}
        {view === "puxada" ? <PullModule /> : null}
      </div>
    </main>
  );
}
