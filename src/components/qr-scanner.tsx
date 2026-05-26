"use client";

import { useRef, useState, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Props = {
  onCode: (code: string) => void;
};

export function QrScanner({ onCode }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startCamera = async () => {
    if (!containerRef.current) return;
    setOpen(true);

    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 280, height: 280 } },
        (decodedText) => {
          scanner.stop().catch(() => {});
          setOpen(false);
          const match = decodedText.trim().match(/\/q\/([A-Za-z0-9_-]+)/i);
          onCodeRef.current(match ? match[1] : decodedText.trim());
        },
        () => {}
      );
    } catch {
      setOpen(false);
      alert("No se pudo acceder a la cámara.\nAsegurate de permitir el acceso.");
    }
  };

  const stopCamera = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={startCamera}
        className="px-3 py-3 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy-light transition-colors flex items-center gap-1.5"
        title="Escanear QR"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path d="M3 7V5a2 2 0 0 1 2-2h2M3 17v2a2 2 0 0 0 2 2h2M17 3h2a2 2 0 0 1 2 2v2M17 21h2a2 2 0 0 0 2-2v-2" />
          <rect x="7" y="7" width="4" height="4" />
          <rect x="13" y="7" width="4" height="4" />
          <rect x="7" y="13" width="4" height="4" />
          <rect x="13" y="13" width="4" height="4" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-black rounded-2xl overflow-hidden">
            <div ref={containerRef} id="qr-reader" className="w-full" />
            <button
              type="button"
              onClick={stopCamera}
              className="absolute top-3 right-3 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center text-lg hover:bg-black/70 transition-colors z-10"
            >
              ✕
            </button>
            <p className="absolute bottom-4 left-0 right-0 text-center text-white text-xs opacity-70 pointer-events-none z-10">
              Apuntá al código QR
            </p>
          </div>
        </div>
      )}
    </>
  );
}
