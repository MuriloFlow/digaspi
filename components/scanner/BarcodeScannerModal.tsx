"use client";

import { Flashlight, FlashlightOff, RotateCw, ScanLine, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizeCode } from "@/lib/storage";

declare global {
  type BarcodeCornerPoint = {
    x: number;
    y: number;
  };

  type BarcodeDetectionResult = {
    rawValue: string;
    boundingBox?: DOMRectReadOnly;
    cornerPoints?: BarcodeCornerPoint[];
  };

  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect: (source: HTMLVideoElement) => Promise<BarcodeDetectionResult[]>;
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

type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: "any" | "natural" | "landscape" | "portrait" | "portrait-primary" | "portrait-secondary" | "landscape-primary" | "landscape-secondary") => Promise<void>;
  unlock?: () => void;
};

const STABLE_READS_REQUIRED = 2;
const MIN_CODE_LENGTH = 4;

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
  const stableReadRef = useRef<{ value: string; count: number; at: number }>({ value: "", count: 0, at: 0 });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Inicializando camera...");
  const [candidate, setCandidate] = useState("");
  const [candidateCount, setCandidateCount] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [scanPulse, setScanPulse] = useState(false);
  const [detectedBox, setDetectedBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);

  const detectorFormats = useMemo(
    () => ["code_128", "code_39", "code_93", "codabar", "ean_13", "ean_8", "itf", "qr_code", "upc_a", "upc_e"],
    []
  );

  const mapBoxToVideo = useCallback((result: BarcodeDetectionResult) => {
    const video = videoRef.current;
    if (!video) return null;

    const rect = video.getBoundingClientRect();
    const videoWidth = video.videoWidth || rect.width;
    const videoHeight = video.videoHeight || rect.height;
    const objectScale = Math.max(rect.width / videoWidth, rect.height / videoHeight);
    const renderedWidth = videoWidth * objectScale;
    const renderedHeight = videoHeight * objectScale;
    const offsetX = (rect.width - renderedWidth) / 2;
    const offsetY = (rect.height - renderedHeight) / 2;

    const points = result.cornerPoints;
    if (points?.length) {
      const xs = points.map((point) => point.x);
      const ys = points.map((point) => point.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      return {
        x: offsetX + minX * objectScale,
        y: offsetY + minY * objectScale,
        width: Math.max(44, (maxX - minX) * objectScale),
        height: Math.max(32, (maxY - minY) * objectScale)
      };
    }

    if (result.boundingBox) {
      return {
        x: offsetX + result.boundingBox.x * objectScale,
        y: offsetY + result.boundingBox.y * objectScale,
        width: Math.max(44, result.boundingBox.width * objectScale),
        height: Math.max(32, result.boundingBox.height * objectScale)
      };
    }

    return null;
  }, []);

  const commitCode = useCallback((raw: string) => {
    const value = normalizeCode(raw);
    if (!value || value.length < MIN_CODE_LENGTH) return false;

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

  const handleDetectedCode = useCallback((raw: string) => {
    const value = normalizeCode(raw);
    if (!value || value.length < MIN_CODE_LENGTH) {
      stableReadRef.current = { value: "", count: 0, at: 0 };
      setCandidate("");
      setCandidateCount(0);
      return false;
    }

    const now = Date.now();
    const previous = stableReadRef.current;
    const sameCandidate = previous.value === value && now - previous.at < 900;
    const nextCount = sameCandidate ? previous.count + 1 : 1;
    stableReadRef.current = { value, count: nextCount, at: now };
    setCandidate(value);
    setCandidateCount(nextCount);

    if (nextCount < STABLE_READS_REQUIRED) {
      setError("");
      setStatus(`Confirmando ${value} (${nextCount}/${STABLE_READS_REQUIRED})`);
      return false;
    }

    return commitCode(value);
  }, [commitCode]);

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
    const updateOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    async function start() {
      setError("");
      setTorchOn(false);
      setTorchAvailable(false);
      setStatus("Inicializando camera...");
      setCandidate("");
      setCandidateCount(0);
      setDetectedBox(null);
      lastReadRef.current = { value: "", at: 0 };
      stableReadRef.current = { value: "", count: 0, at: 0 };

      updateOrientation();
      window.addEventListener("resize", updateOrientation);
      const orientation = window.screen.orientation as LockableScreenOrientation | undefined;
      orientation?.lock?.("landscape").catch(() => undefined);

      if (!window.BarcodeDetector) {
        setStatus("Entrada manual ativa");
        setError("Scanner automatico indisponivel neste navegador. Feche e digite o codigo no campo da nota.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30, max: 60 }
          },
          audio: false
        });
        streamRef.current = stream;

        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
        setTorchAvailable(Boolean(capabilities?.torch));
        try {
          await track.applyConstraints({
            advanced: [
              {
                focusMode: "continuous",
                exposureMode: "continuous",
                whiteBalanceMode: "continuous"
              } as MediaTrackConstraintSet
            ]
          });
        } catch {
          // Advanced camera controls are optional and vary by browser.
        }

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
              const best = codes[0];
              const value = best?.rawValue?.trim();
              const box = best ? mapBoxToVideo(best) : null;
              setDetectedBox(box);
              if (value && handleDetectedCode(value)) return;
              if (!value) {
                setStatus("Procurando codigo na camera inteira...");
                setDetectedBox(null);
                stableReadRef.current = { value: "", count: 0, at: 0 };
                setCandidate("");
                setCandidateCount(0);
              }
            } catch {
              setError("Nao foi possivel ler agora. Aproxime a camera e melhore a luz.");
            } finally {
              busy = false;
            }
          }

          timer = window.setTimeout(scan, 65);
        };

        timer = window.setTimeout(scan, 120);
      } catch {
        setStatus("Entrada manual ativa");
        setError("Camera bloqueada. Libere a permissao ou feche e digite o codigo no campo da nota.");
      }
    }

    start();

    return () => {
      cancelled = true;
      window.removeEventListener("resize", updateOrientation);
      const orientation = window.screen.orientation as LockableScreenOrientation | undefined;
      orientation?.unlock?.();
      if (timer) window.clearTimeout(timer);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [detectorFormats, handleDetectedCode, mapBoxToVideo, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black">
      <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" muted playsInline />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.34),transparent_18%,transparent_82%,rgba(0,0,0,0.34))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 to-transparent" />

      <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
        <div className="rounded-lg bg-black/60 px-3 py-2 text-white backdrop-blur">
          <h2 className="text-base font-black">Scanner da nota</h2>
          <p className="mt-1 text-xs font-bold text-white/85">{status}</p>
        </div>
        <button className="flex h-11 w-11 items-center justify-center rounded-md bg-white/90 text-digaspi-ink" onClick={onClose}>
          <X className="h-5 w-5" />
        </button>
      </div>

      {!isLandscape ? (
        <div className="absolute left-4 right-4 top-24 flex items-center gap-3 rounded-lg bg-amber-50/95 p-3 text-amber-800 shadow-panel">
          <RotateCw className="h-6 w-6 shrink-0" />
          <p className="text-sm font-black">Vire o celular de lado para a barra caber inteira na tela.</p>
        </div>
      ) : null}

      <div
        className={`absolute inset-x-4 top-1/2 h-0.5 bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.95)] transition ${
          scanPulse ? "opacity-100" : "opacity-75"
        }`}
      />

      {detectedBox ? (
        <div
          className="absolute rounded-md border-4 border-digaspi-green bg-green-400/10 shadow-[0_0_26px_rgba(20,128,74,0.85)] transition-all duration-75"
          style={{
            left: `${detectedBox.x}px`,
            top: `${detectedBox.y}px`,
            width: `${detectedBox.width}px`,
            height: `${detectedBox.height}px`
          }}
        >
          <span className="absolute -top-8 left-0 rounded-md bg-digaspi-green px-2 py-1 text-xs font-black text-white">
            Validado
          </span>
        </div>
      ) : (
        <div className="absolute left-1/2 top-1/2 flex h-24 w-[90vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border-2 border-dashed border-white/75 px-4 text-center text-xs font-black uppercase tracking-wide text-white/90 landscape:h-28 landscape:w-[82vw]">
          Enquadre a barra inteira na horizontal
        </div>
      )}

      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <span className="inline-flex items-center gap-2 rounded-md bg-black/65 px-3 py-2 text-xs font-black text-white backdrop-blur">
            <ScanLine className="h-4 w-4" />
            {candidate ? `${candidateCount}/${STABLE_READS_REQUIRED}` : "Tempo real"}
          </span>
          {error ? <p className="rounded-md bg-red-600/95 p-3 text-sm font-black text-white shadow-panel">{error}</p> : null}
        </div>
        {torchAvailable ? (
          <button
            type="button"
            onClick={toggleTorch}
            className="flex h-12 shrink-0 items-center gap-2 rounded-md bg-white px-3 text-xs font-black text-digaspi-ink"
          >
            {torchOn ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
            Luz
          </button>
        ) : null}
      </div>
    </div>
  );
}
