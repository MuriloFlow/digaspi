"use client";

import { FormEvent, useMemo, useState } from "react";
import { ClipboardCopy, Trash2 } from "lucide-react";
import { formatTime, normalizeName } from "@/lib/storage";
import { usePulls } from "@/hooks/usePulls";
import { ConfirmButton } from "@/components/common/ConfirmButton";

export function PullModule() {
  const pulls = usePulls();
  const [funcionario, setFuncionario] = useState("");
  const [marca, setMarca] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const reportText = useMemo(() => {
    const lines = [
      "Puxada do dia",
      `Registros: ${pulls.totalToday}`,
      ...Object.entries(pulls.byBrand).map(([brand, total]) => `${brand}: ${total}`),
      "",
      ...pulls.today.map((record) => `${formatTime(record.createdAt)} - ${record.funcionario} - ${record.marca}`)
    ];

    return lines.join("\n");
  }, [pulls.byBrand, pulls.today, pulls.totalToday]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanEmployee = normalizeName(funcionario);
    const cleanBrand = normalizeName(marca);

    if (!cleanEmployee) {
      setError("Informe o nome do funcionario.");
      return;
    }

    if (!cleanBrand) {
      setError("Informe a marca.");
      return;
    }

    pulls.add({
      funcionario: cleanEmployee,
      marca: cleanBrand
    });
    setMarca("");
    setError("");
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.alert(reportText);
    }
  }

  return (
    <section className="space-y-4">
      <form onSubmit={submit} className="rounded-lg border border-digaspi-line bg-white p-4 shadow-panel">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-digaspi-ink">Registrar puxada</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">Registros hoje: {pulls.totalToday}</p>
          </div>
          {pulls.today.length > 0 ? (
            <ConfirmButton
              message="Limpar registros de hoje?"
              onConfirm={pulls.clearToday}
              className="rounded-md bg-red-50 px-3 py-2 text-sm font-black text-digaspi-red"
            >
              Limpar
            </ConfirmButton>
          ) : null}
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-bold text-slate-700">Funcionario</span>
          <input
            className="h-12 w-full rounded-md border border-digaspi-line px-3 font-bold outline-none focus:border-digaspi-blue"
            value={funcionario}
            onChange={(event) => setFuncionario(event.target.value)}
            placeholder="Nome"
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-bold text-slate-700">Marca</span>
          <input
            className="h-12 w-full rounded-md border border-digaspi-line px-3 font-bold outline-none focus:border-digaspi-blue"
            value={marca}
            onChange={(event) => setMarca(event.target.value)}
            placeholder="Digite a marca"
          />
        </label>

        {error ? <p className="mt-3 rounded-md bg-red-50 p-3 text-sm font-bold text-digaspi-red">{error}</p> : null}

        <button className="mt-4 h-12 w-full rounded-md bg-digaspi-blue font-black text-white" type="submit">
          Registrar
        </button>
      </form>

      <div className="rounded-lg border border-digaspi-line bg-white p-4 shadow-panel">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-digaspi-ink">Resumo por marca</h3>
          {pulls.today.length > 0 ? (
            <button
              type="button"
              onClick={copyReport}
              className="flex h-10 items-center gap-2 rounded-md bg-digaspi-pale px-3 text-sm font-black text-digaspi-blue"
            >
              <ClipboardCopy className="h-4 w-4" />
              {copied ? "Copiado" : "Copiar"}
            </button>
          ) : null}
        </div>

        {Object.keys(pulls.byBrand).length === 0 ? (
          <p className="mt-3 text-sm font-semibold text-slate-600">Nenhuma puxada registrada.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {Object.entries(pulls.byBrand).map(([brand, total]) => (
              <div key={brand} className="rounded-md bg-digaspi-pale p-3">
                <p className="text-xs font-black uppercase text-slate-500">{brand}</p>
                <p className="mt-1 text-xl font-black text-digaspi-ink">{total}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-digaspi-line bg-white shadow-panel">
        <div className="border-b border-digaspi-line p-4">
          <h3 className="text-lg font-black text-digaspi-ink">Historico do dia</h3>
        </div>

        {pulls.today.length === 0 ? (
          <p className="p-5 text-center font-bold text-slate-600">Nenhuma puxada registrada hoje.</p>
        ) : (
          <div className="divide-y divide-digaspi-line">
            {pulls.today.map((record) => (
              <div key={record.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-black text-digaspi-ink">{record.funcionario}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {record.marca} - {formatTime(record.createdAt)}
                  </p>
                </div>
                <ConfirmButton
                  message="Apagar este registro?"
                  onConfirm={() => pulls.remove(record.id)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-digaspi-red"
                >
                  <Trash2 className="h-4 w-4" />
                </ConfirmButton>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
