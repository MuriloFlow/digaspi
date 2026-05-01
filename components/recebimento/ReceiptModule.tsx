"use client";

import { Camera, CheckCircle2, Minus, Plus, RotateCcw, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Brand } from "@/lib/constants";
import { formatDateTime, normalizeCode } from "@/lib/storage";
import { useReceipts } from "@/hooks/useReceipts";
import { BrandSelect } from "@/components/common/BrandSelect";
import { ConfirmButton } from "@/components/common/ConfirmButton";
import { BarcodeScannerModal } from "@/components/scanner/BarcodeScannerModal";

type ReceiptFilter = "abertas" | "todas" | "concluidas";

export function ReceiptModule() {
  const receipts = useReceipts();
  const [codigo, setCodigo] = useState("");
  const [marca, setMarca] = useState<Brand>("Nike");
  const [total, setTotal] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [filter, setFilter] = useState<ReceiptFilter>("abertas");
  const [error, setError] = useState("");

  const visibleNotes = useMemo(() => {
    if (filter === "abertas") return receipts.notes.filter((note) => note.atual < note.total);
    if (filter === "concluidas") return receipts.notes.filter((note) => note.atual >= note.total);
    return receipts.notes;
  }, [filter, receipts.notes]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanCode = normalizeCode(codigo);
    const parsedTotal = Number(total);

    if (!cleanCode) {
      setError("Informe o codigo da nota.");
      return;
    }

    if (receipts.exists(cleanCode)) {
      setError("Esta nota ja esta aberta.");
      return;
    }

    if (!Number.isInteger(parsedTotal) || parsedTotal <= 0 || parsedTotal > 9999) {
      setError("Informe uma quantidade valida.");
      return;
    }

    receipts.add({ codigo: cleanCode, marca, total: parsedTotal });
    setCodigo("");
    setTotal("");
    setError("");
    setFilter("abertas");
  }

  return (
    <section className="space-y-4">
      <form onSubmit={submit} className="rounded-lg border border-digaspi-line bg-white p-4 shadow-panel">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-digaspi-ink">Nova nota fiscal</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">Conferencia por quantidade, sem papel.</p>
          </div>
          {receipts.stats.done > 0 ? (
            <ConfirmButton
              message="Apagar todas as notas concluidas?"
              onConfirm={receipts.removeCompleted}
              className="rounded-md bg-green-50 px-3 py-2 text-sm font-black text-digaspi-green"
            >
              Limpar concluidas
            </ConfirmButton>
          ) : null}
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-bold text-slate-700">Codigo da nota</span>
          <div className="flex gap-2">
            <input
              className="h-12 min-w-0 flex-1 rounded-md border border-digaspi-line px-3 font-bold uppercase outline-none focus:border-digaspi-blue"
              inputMode="text"
              value={codigo}
              onChange={(event) => setCodigo(event.target.value.toUpperCase())}
              placeholder="Ex: 351405..."
            />
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-digaspi-blue text-white"
              aria-label="Ler codigo pela camera"
            >
              <Camera className="h-5 w-5" />
            </button>
          </div>
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-slate-700">Marca</span>
            <BrandSelect value={marca} onChange={setMarca} />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-slate-700">Quantidade total</span>
            <input
              className="h-12 w-full rounded-md border border-digaspi-line px-3 font-bold outline-none focus:border-digaspi-blue"
              inputMode="numeric"
              type="number"
              min="1"
              max="9999"
              value={total}
              onChange={(event) => setTotal(event.target.value)}
              placeholder="15"
            />
          </label>
        </div>

        {error ? <p className="mt-3 rounded-md bg-red-50 p-3 text-sm font-bold text-digaspi-red">{error}</p> : null}

        <button className="mt-4 h-12 w-full rounded-md bg-digaspi-blue font-black text-white" type="submit">
          Adicionar nota
        </button>
      </form>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Aberta(s)" value={receipts.stats.open} />
        <Stat label="Concluida(s)" value={receipts.stats.done} />
        <Stat label="Itens" value={`${receipts.stats.checkedItems}/${receipts.stats.totalItems}`} />
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-lg border border-digaspi-line bg-white p-2 shadow-panel">
        {(["abertas", "todas", "concluidas"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`h-10 rounded-md text-sm font-black capitalize ${
              filter === item ? "bg-digaspi-blue text-white" : "bg-digaspi-pale text-digaspi-blue"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visibleNotes.length === 0 ? (
          <div className="rounded-lg border border-digaspi-line bg-white p-5 text-center font-bold text-slate-600 shadow-panel">
            Nenhuma nota neste filtro.
          </div>
        ) : (
          visibleNotes.map((note) => {
            const done = note.atual >= note.total;
            const percent = Math.round((note.atual / note.total) * 100);

            return (
              <article
                key={note.id}
                className={`rounded-lg border p-4 shadow-panel ${
                  done ? "border-green-200 bg-green-50" : "border-digaspi-line bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black text-digaspi-ink">{note.codigo}</p>
                    <p className="mt-1 text-sm font-bold text-slate-600">
                      {note.marca} - {formatDateTime(note.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      done ? "bg-digaspi-green text-white" : "bg-digaspi-pale text-digaspi-blue"
                    }`}
                  >
                    {done ? "Concluido" : "Aberta"}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-sm font-black">
                    <span>Progresso</span>
                    <span>
                      {note.atual}/{note.total}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full ${done ? "bg-digaspi-green" : "bg-digaspi-blue"}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      receipts.increment(note.id);
                      navigator.vibrate?.(20);
                    }}
                    disabled={done}
                    className="flex h-14 items-center justify-center gap-2 rounded-md bg-digaspi-blue font-black text-white disabled:bg-digaspi-green"
                  >
                    {done ? <CheckCircle2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    {done ? "Finalizada" : "Marcar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => receipts.decrement(note.id)}
                    className="flex h-14 items-center justify-center gap-2 rounded-md border border-digaspi-line bg-white font-black text-digaspi-blue"
                  >
                    <Minus className="h-5 w-5" />
                    Desfazer
                  </button>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <ConfirmButton
                    message="Resetar a contagem desta nota?"
                    onConfirm={() => receipts.reset(note.id)}
                    className="flex h-11 items-center justify-center gap-2 rounded-md bg-amber-50 font-black text-amber-700"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Resetar
                  </ConfirmButton>
                  <ConfirmButton
                    message="Apagar esta nota?"
                    onConfirm={() => receipts.remove(note.id)}
                    className="flex h-11 items-center justify-center gap-2 rounded-md bg-red-50 font-black text-digaspi-red"
                  >
                    <Trash2 className="h-4 w-4" />
                    Apagar
                  </ConfirmButton>
                </div>
              </article>
            );
          })
        )}
      </div>

      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onRead={(value) => setCodigo(normalizeCode(value))}
      />
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-digaspi-line bg-white p-3 text-center shadow-panel">
      <p className="text-xl font-black text-digaspi-ink">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase text-slate-500">{label}</p>
    </div>
  );
}
