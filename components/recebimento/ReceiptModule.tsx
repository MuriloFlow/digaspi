"use client";

import { Camera, CheckCircle2, History, Minus, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { formatDateTime, normalizeCode, normalizeName } from "@/lib/storage";
import { useReceipts } from "@/hooks/useReceipts";
import { ConfirmButton } from "@/components/common/ConfirmButton";
import { BarcodeScannerModal } from "@/components/scanner/BarcodeScannerModal";

type ReceiptView = "abertas" | "historico";

export function ReceiptModule() {
  const receipts = useReceipts();
  const [codigo, setCodigo] = useState("");
  const [marca, setMarca] = useState("");
  const [total, setTotal] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [view, setView] = useState<ReceiptView>("abertas");
  const [error, setError] = useState("");

  const activeNotes = useMemo(() => receipts.notes.filter((note) => note.atual < note.total), [receipts.notes]);
  const historyNotes = useMemo(() => receipts.notes.filter((note) => note.atual >= note.total), [receipts.notes]);
  const visibleNotes = view === "abertas" ? activeNotes : historyNotes;

  function closeForm() {
    setFormOpen(false);
    setError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanCode = normalizeCode(codigo);
    const cleanBrand = normalizeName(marca);
    const parsedTotal = Number(total);

    if (!cleanCode) {
      setError("Informe o codigo da nota.");
      return;
    }

    if (!cleanBrand) {
      setError("Informe a marca.");
      return;
    }

    if (receipts.exists(cleanCode)) {
      setError("Esta nota ja esta salva.");
      return;
    }

    if (!Number.isInteger(parsedTotal) || parsedTotal <= 0 || parsedTotal > 9999) {
      setError("Informe uma quantidade valida.");
      return;
    }

    receipts.add({ codigo: cleanCode, marca: cleanBrand, total: parsedTotal });
    setCodigo("");
    setMarca("");
    setTotal("");
    setError("");
    setView("abertas");
    setFormOpen(false);
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-digaspi-line bg-white p-4 shadow-panel">
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-md bg-digaspi-blue text-lg font-black text-white"
        >
          <Plus className="h-6 w-6" />
          NOVA NOTA
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Abertas" value={receipts.stats.open} />
        <Stat label="Historico" value={receipts.stats.done} />
        <Stat label="Itens" value={`${receipts.stats.checkedItems}/${receipts.stats.totalItems}`} />
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg border border-digaspi-line bg-white p-2 shadow-panel">
        <button
          type="button"
          onClick={() => setView("abertas")}
          className={`h-11 rounded-md font-black ${
            view === "abertas" ? "bg-digaspi-blue text-white" : "bg-digaspi-pale text-digaspi-blue"
          }`}
        >
          Abertas
        </button>
        <button
          type="button"
          onClick={() => setView("historico")}
          className={`flex h-11 items-center justify-center gap-2 rounded-md font-black ${
            view === "historico" ? "bg-digaspi-blue text-white" : "bg-digaspi-pale text-digaspi-blue"
          }`}
        >
          <History className="h-4 w-4" />
          Historico
        </button>
      </div>

      {view === "historico" && historyNotes.length > 0 ? (
        <ConfirmButton
          message="Apagar todas as notas concluidas do historico?"
          onConfirm={receipts.removeCompleted}
          className="h-11 w-full rounded-md bg-red-50 font-black text-digaspi-red"
        >
          Limpar historico concluido
        </ConfirmButton>
      ) : null}

      <div className="space-y-3">
        {visibleNotes.length === 0 ? (
          <div className="rounded-lg border border-digaspi-line bg-white p-5 text-center font-bold text-slate-600 shadow-panel">
            {view === "abertas" ? "Nenhuma nota aberta." : "Nenhuma nota concluida no historico."}
          </div>
        ) : (
          visibleNotes.map((note) => <ReceiptCard key={note.id} note={note} receipts={receipts} />)
        )}
      </div>

      {formOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="mx-auto flex min-h-full max-w-md items-center">
            <form
              onSubmit={submit}
              className="w-full rounded-lg border border-digaspi-line bg-white p-4 shadow-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-receipt-title"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="new-receipt-title" className="text-xl font-black text-digaspi-ink">
                    Nova nota fiscal
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600">Conferencia por quantidade, sem papel.</p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-digaspi-pale"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <label className="mt-4 block">
                <span className="mb-1 block text-sm font-bold text-slate-700">Codigo da nota</span>
                <div className="flex gap-2">
                  <input
                    className="h-12 min-w-0 flex-1 rounded-md border border-digaspi-line px-3 font-bold uppercase outline-none focus:border-digaspi-blue"
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

              <label className="mt-4 block">
                <span className="mb-1 block text-sm font-bold text-slate-700">Marca</span>
                <input
                  className="h-12 w-full rounded-md border border-digaspi-line px-3 font-bold outline-none focus:border-digaspi-blue"
                  value={marca}
                  onChange={(event) => setMarca(event.target.value)}
                  placeholder="Digite a marca"
                />
              </label>

              <label className="mt-4 block">
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

              {error ? <p className="mt-3 rounded-md bg-red-50 p-3 text-sm font-bold text-digaspi-red">{error}</p> : null}

              <button className="mt-4 h-12 w-full rounded-md bg-digaspi-blue font-black text-white" type="submit">
                Confirmar nota
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        isDuplicate={(value) => receipts.exists(normalizeCode(value))}
        onRead={(value) => {
          const cleanCode = normalizeCode(value);
          setCodigo(cleanCode);
          if (receipts.exists(cleanCode)) {
            setError("Esta nota ja esta salva.");
          } else {
            setError("");
          }
        }}
      />
    </section>
  );
}

function ReceiptCard({
  note,
  receipts
}: {
  note: ReturnType<typeof useReceipts>["notes"][number];
  receipts: ReturnType<typeof useReceipts>;
}) {
  const done = note.atual >= note.total;
  const percent = Math.round((note.atual / note.total) * 100);

  return (
    <article
      className={`rounded-lg border p-4 shadow-panel ${done ? "border-green-200 bg-green-50" : "border-digaspi-line bg-white"}`}
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
          <div className={`h-full ${done ? "bg-digaspi-green" : "bg-digaspi-blue"}`} style={{ width: `${percent}%` }} />
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
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-digaspi-line bg-white p-3 text-center shadow-panel">
      <p className="text-xl font-black text-digaspi-ink">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase text-slate-500">{label}</p>
    </div>
  );
}
