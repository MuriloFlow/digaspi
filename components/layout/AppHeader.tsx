"use client";

import { ArrowLeft, LogOut } from "lucide-react";
import { DigaspiLogo } from "@/components/brand/DigaspiLogo";
import { ViewKey } from "@/components/home/HomeMenu";

type Props = {
  currentView: ViewKey;
  onBack: () => void;
  onLogout: () => void;
};

const titles: Record<ViewKey, string> = {
  menu: "Rotina de estoque",
  recebimento: "Recebimento",
  puxada: "Puxada"
};

export function AppHeader({ currentView, onBack, onLogout }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-digaspi-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {currentView !== "menu" ? (
            <button
              type="button"
              onClick={onBack}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-digaspi-line text-digaspi-blue"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <DigaspiLogo compact />
          )}
          <h1 className="truncate text-lg font-black text-digaspi-ink">{titles[currentView]}</h1>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm("Sair do sistema?")) onLogout();
          }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-digaspi-line text-digaspi-red"
          aria-label="Sair"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
