"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { normalizeCode } from "@/lib/storage";

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
    };
  }
}

type Props = {
  open: boolean;
  onClose: () => void;
  onRead: (value: string) => void;
};

export function BarcodeScannerModal({ open, onClose, onRead }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [manual, setManual] = useState("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    let frame = 0;

    async function start() {
      setError("");
      setManual("");

      if (!window.BarcodeDetector) {
        setError("Scanner automatico indisponivel neste navegador. Digite o codigo manualmente.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false
        });
        streamRef.current = stream;

        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const detector = new window.BarcodeDetector({
          formats: ["code_128", "code_39", "ean_13", "ean_8", "qr_code"]
        });

        const scan = async () => {
          if (cancelled || !videoRef.current) return;

          try {
            const codes = await detector.detect(videoRef.current);
            const value = codes[0]?.rawValue?.trim();
            if (value) {
              onRead(normalizeCode(value));
              onClose();
              return;
            }
          } catch {
            setError("Nao foi possivel ler o codigo. Ajuste a distancia e a luz.");
          }

          frame = window.requestAnimationFrame(scan);
        };

        frame = window.requestAnimationFrame(scan);
      } catch {
        setError("Camera bloqueada. Libere a permissao ou digite o codigo manualmente.");
      }
    }

    start();

    return () => {
      cancelled = true;
      if (frame) window.cancelAnimationFrame(frame);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [onClose, onRead, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-4">
      <div className="mx-auto flex h-full max-w-md flex-col overflow-hidden rounded-lg bg-white">
        <div className="flex items-center justify-between border-b border-digaspi-line p-4">
          <h2 className="text-lg font-black text-digaspi-ink">Scanner da nota</h2>
          <button className="flex h-10 w-10 items-center justify-center rounded-md bg-digaspi-pale" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="relative min-h-[320px] overflow-hidden rounded-lg bg-slate-900">
            <video ref={videoRef} className="h-full min-h-[320px] w-full object-cover" muted playsInline />
            <div className="absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-lg border-2 border-white/90" />
          </div>
          {error ? <p className="rounded-md bg-red-50 p-3 text-sm font-bold text-digaspi-red">{error}</p> : null}
          <p className="text-center text-sm font-semibold text-slate-600">
            Aponte para o codigo de barras da nota. Se nao ler, feche e digite manualmente.
          </p>
          <div className="rounded-lg border border-digaspi-line bg-digaspi-pale p-3">
            <label className="block">
              <span className="mb-1 block text-sm font-black text-digaspi-ink">Entrada manual rapida</span>
              <input
                className="h-11 w-full rounded-md border border-digaspi-line px-3 font-bold uppercase outline-none"
                value={manual}
                onChange={(event) => setManual(event.target.value.toUpperCase())}
                placeholder="Digite ou cole o codigo"
              />
            </label>
            <button
              type="button"
              disabled={!manual.trim()}
              onClick={() => {
                onRead(normalizeCode(manual));
                onClose();
              }}
              className="mt-2 h-11 w-full rounded-md bg-digaspi-blue font-black text-white disabled:opacity-50"
            >
              Usar codigo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
