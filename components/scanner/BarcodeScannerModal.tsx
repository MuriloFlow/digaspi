"use client";

import { Flashlight, FlashlightOff, ScanLine, X, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizeCode } from "@/lib/storage";

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
    };
    webkitAudioContext?: typeof AudioContext;
  }
}

type Props = {
  open: boolean;
  onClose: () => void;
  onRead: (value: string) => void;
  isDuplicate?: (value: string) => boolean;
};

function playBlip(kind: "ok" | "warn" = "ok") {
  try {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    const context = new AudioCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = kind === "ok" ? 1180 : 260;
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.13);
  } catch {
    // Audio feedback is optional.
  }
}

export function BarcodeScannerModal({ open, onClose, onRead, isDuplicate }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastReadRef = useRef<{ value: string; at: number }>({ value: "", at: 0 });
  const [error, setError] = useState("");
  const [manual, setManual] = useState("");
  const [status, setStatus] = useState("Inicializando camera...");
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [scanPulse, setScanPulse] = useState(false);

  const detectorFormats = useMemo(
    () => ["code_128", "code_39", "code_93", "codabar", "ean_13", "ean_8", "itf", "qr_code", "upc_a", "upc_e"],
    []
  );

  const handleCode = useCallback((raw: string) => {
    const value = normalizeCode(raw);
    if (!value) return false;

    const now = Date.now();
    if (lastReadRef.current.value === value && now - lastReadRef.current.at < 1200) return false;
    lastReadRef.current = { value, at: now };

    setScanPulse(true);
    window.setTimeout(() => setScanPulse(false), 180);

    if (isDuplicate?.(value)) {
      setError(`Nota ${value} ja esta registrada.`);
      setStatus("Codigo duplicado");
      navigator.vibrate?.([80, 40, 80]);
      playBlip("warn");
      return false;
    }

    setError("");
    setStatus(`Lido: ${value}`);
    navigator.vibrate?.(35);
    playBlip("ok");
    onRead(value);
    window.setTimeout(onClose, 180);
    return true;
  }, [isDuplicate, onClose, onRead]);

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;

    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] });
      setTorchOn((current) => !current);
    } catch {
      setError("Lanterna indisponivel neste aparelho.");
    }
  }

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    let timer = 0;
    let busy = false;

    async function start() {
      setError("");
      setManual("");
      setTorchOn(false);
      setTorchAvailable(false);
      setStatus("Inicializando camera...");
      lastReadRef.current = { value: "", at: 0 };

      if (!window.BarcodeDetector) {
        setStatus("Entrada manual ativa");
        setError("Scanner automatico indisponivel neste navegador. Use a entrada manual.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        streamRef.current = stream;

        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
        setTorchAvailable(Boolean(capabilities?.torch));

        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        setStatus("Procurando codigo...");

        const detector = new window.BarcodeDetector({ formats: detectorFormats });

        const scan = async () => {
          if (cancelled || !videoRef.current) return;

          if (!busy && videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            busy = true;
            try {
              const codes = await detector.detect(videoRef.current);
              const value = codes[0]?.rawValue?.trim();
              if (value && handleCode(value)) return;
              if (!value) setStatus("Procurando codigo...");
            } catch {
              setError("Nao foi possivel ler agora. Aproxime a camera e melhore a luz.");
            } finally {
              busy = false;
            }
          }

          timer = window.setTimeout(scan, 90);
        };

        timer = window.setTimeout(scan, 120);
      } catch {
        setStatus("Entrada manual ativa");
        setError("Camera bloqueada. Libere a permissao ou use a entrada manual.");
      }
    }

    start();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [detectorFormats, handleCode, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 p-4">
      <div className="mx-auto flex h-full max-w-md flex-col overflow-hidden rounded-lg bg-white">
        <div className="flex items-center justify-between border-b border-digaspi-line p-4">
          <div>
            <h2 className="text-lg font-black text-digaspi-ink">Scanner da nota</h2>
            <p className="mt-1 text-xs font-bold text-digaspi-blue">{status}</p>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-md bg-digaspi-pale" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
          <div className="relative min-h-[330px] overflow-hidden rounded-lg bg-slate-950">
            <video ref={videoRef} className="h-full min-h-[330px] w-full object-cover" muted playsInline />
            <div className="absolute inset-x-7 top-1/2 h-24 -translate-y-1/2 rounded-lg border-2 border-white shadow-[0_0_0_999px_rgba(0,0,0,0.28)]" />
            <div
              className={`absolute inset-x-10 top-1/2 h-0.5 bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.95)] transition ${
                scanPulse ? "opacity-100" : "opacity-70"
              }`}
            />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 rounded-md bg-black/65 px-3 py-2 text-xs font-black text-white">
                <ScanLine className="h-4 w-4" />
                Tempo real
              </span>
              {torchAvailable ? (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className="flex h-10 items-center gap-2 rounded-md bg-white px-3 text-xs font-black text-digaspi-ink"
                >
                  {torchOn ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
                  Luz
                </button>
              ) : null}
            </div>
          </div>

          {error ? <p className="rounded-md bg-red-50 p-3 text-sm font-bold text-digaspi-red">{error}</p> : null}

          <div className="rounded-lg border border-digaspi-line bg-digaspi-pale p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-black text-digaspi-ink">
              <Zap className="h-4 w-4 text-digaspi-blue" />
              Entrada manual rapida
            </div>
            <input
              className="h-11 w-full rounded-md border border-digaspi-line px-3 font-bold uppercase outline-none"
              value={manual}
              onChange={(event) => setManual(event.target.value.toUpperCase())}
              placeholder="Digite ou cole o codigo"
            />
            <button
              type="button"
              disabled={!manual.trim()}
              onClick={() => handleCode(manual)}
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
