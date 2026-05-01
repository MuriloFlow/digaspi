export function DigaspiLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`grid overflow-hidden rounded-md shadow-panel ${
        compact ? "h-11 w-36 grid-cols-[42px_1fr]" : "h-20 w-64 grid-cols-[78px_1fr]"
      }`}
      aria-label="Di Gaspi"
    >
      <div className="flex items-center justify-center bg-digaspi-red text-white">
        <span className={compact ? "text-3xl font-black" : "text-6xl font-black"}>Di</span>
      </div>
      <div className="flex items-center bg-digaspi-blue px-3 text-white">
        <span className={compact ? "text-2xl font-black" : "text-5xl font-black"}>Gaspi</span>
      </div>
    </div>
  );
}
