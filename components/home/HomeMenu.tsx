"use client";

import { BarChart3, ClipboardCheck, PackageCheck, ShieldCheck } from "lucide-react";

export type ViewKey = "menu" | "recebimento" | "puxada";

type Props = {
  onOpen: (view: ViewKey) => void;
};

export function HomeMenu({ onOpen }: Props) {
  return (
    <section className="space-y-4">
      <div className="rounded-lg bg-digaspi-blue p-5 text-white shadow-panel">
        <p className="text-sm font-bold opacity-90">Loja L41</p>
        <h2 className="mt-1 text-2xl font-black">O que vamos fazer agora?</h2>
      </div>

      <div className="grid gap-4">
        <MenuCard
          icon={<PackageCheck className="h-9 w-9" />}
          title="RECEBIMENTO"
          text="Conferir notas fiscais por quantidade, com multiplas notas abertas."
          onClick={() => onOpen("recebimento")}
        />
        <MenuCard
          icon={<BarChart3 className="h-9 w-9" />}
          title="PUXADA"
          text="Registrar organizacao de produtos por funcionario, marca e quantidade."
          onClick={() => onOpen("puxada")}
        />
      </div>

      <div className="rounded-lg border border-digaspi-line bg-white p-4 shadow-panel">
        <div className="flex items-start gap-3">
          <ClipboardCheck className="h-6 w-6 text-digaspi-green" />
          <div>
            <p className="text-sm font-black text-slate-800">Dados salvos no celular por 72 horas.</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Funciona rapido e sem internet depois de carregado.</p>
          </div>
        </div>
        <div className="mt-3 flex items-start gap-3 rounded-md bg-digaspi-pale p-3">
          <ShieldCheck className="h-5 w-5 text-digaspi-blue" />
          <p className="text-xs font-bold text-slate-600">Nao usa banco de dados, API externa ou chave secreta.</p>
        </div>
      </div>
    </section>
  );
}

function MenuCard({
  icon,
  title,
  text,
  onClick
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-36 w-full items-center gap-4 rounded-lg border border-digaspi-line bg-white p-5 text-left shadow-panel active:scale-[0.99]"
    >
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-digaspi-pale text-digaspi-blue">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-black text-digaspi-ink">{title}</span>
        <span className="mt-1 block text-sm font-medium leading-5 text-slate-600">{text}</span>
      </span>
    </button>
  );
}
