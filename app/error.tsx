"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-digaspi-pale px-4">
      <section className="w-full max-w-sm rounded-lg border border-digaspi-line bg-white p-5 text-center shadow-panel">
        <h1 className="text-xl font-black text-digaspi-ink">Algo travou na tela</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Seus dados ficam salvos no aparelho por 72 horas. Tente recarregar a tela.
        </p>
        <button className="mt-5 h-12 w-full rounded-md bg-digaspi-blue font-black text-white" onClick={reset}>
          Recarregar
        </button>
      </section>
    </main>
  );
}
