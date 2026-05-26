"use client";

import { useRef, useState } from "react";
import jsQR from "jsqr";

type Props = {
  onCode: (code: string) => void;
};

export function QrScanner({ onCode }: Props) {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);

  const startCamera = async () => {
    setOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      scanFrame();
    } catch {
      setOpen(false);
      alert("No se pudo acceder a la cámara");
    }
  };

  const stopCamera = () => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setOpen(false);
  };

  const scanFrame = () => {
    if (!videoRef.current || !open) return;
    scanningRef.current = true;

    const video = videoRef.current;
    if (video.readyState < video.HAVE_CURRENT_DATA) {
      if (scanningRef.current) requestAnimationFrame(scanFrame);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code) {
      stopCamera();
      onCode(code.data);
      return;
    }

    if (scanningRef.current) {
      requestAnimationFrame(scanFrame);
    }
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
          <div className="relative max-w-sm w-full bg-black rounded-2xl overflow-hidden">
            <video ref={videoRef} className="w-full aspect-square object-cover" playsInline muted />
            <div className="absolute inset-0 border-[3px] border-gold/60 rounded-2xl pointer-events-none" />
            <button
              type="button"
              onClick={stopCamera}
              className="absolute top-3 right-3 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center text-lg hover:bg-black/70 transition-colors"
            >
              ✕
            </button>
            <p className="absolute bottom-4 left-0 right-0 text-center text-white text-xs opacity-70">
              Apuntá al código QR
            </p>
          </div>
        </div>
      )}
    </>
  );
}
