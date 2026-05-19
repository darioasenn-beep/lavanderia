"use client";

import { useState, useCallback, useRef } from "react";
import QRCode from "qrcode";

export default function PrintQRs() {
  const [count, setCount] = useState(10);
  const [qrs, setQrs] = useState<{ id: string; dataUrl: string }[]>([]);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : "https://lavanderia.com.ar";

  const generate = useCallback(async () => {
    setGenerating(true);
    setMessage("");

    const ids: string[] = [];
    const newQrs: { id: string; dataUrl: string }[] = [];
    for (let i = 0; i < count; i++) {
      const id = generateId();
      ids.push(id);
      const dataUrl = await QRCode.toDataURL(`${baseUrl}/q/${id}`, {
        width: 300,
        margin: 1,
        color: { dark: "#0F172A", light: "#F8F6F0" },
      });
      newQrs.push({ id, dataUrl });
    }

    setQrs(newQrs);

    const res = await fetch("/api/admin/bulk-qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessage(
        `${data.inserted} código(s) guardado(s) en la base de datos${
          data.skipped ? ` (${data.skipped} ya existían)` : ""
        }`
      );
    } else {
      const err = await res.json();
      setMessage(`Error al guardar: ${err.error}`);
    }

    setGenerating(false);
  }, [count, baseUrl]);

  const handlePrint = useCallback(() => {
    const win = window.open("", "_blank");
    if (!win || !printRef.current) return;
    win.document.write(`
      <html>
        <head>
          <title>Laundri-Sync - Códigos QR</title>
          <style>
            @page { margin: 1cm; }
            body { font-family: system-ui, sans-serif; margin: 0; padding: 1cm; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1cm; }
            .card { text-align: center; page-break-inside: avoid; }
            img { width: 100%; max-width: 200px; }
            p { margin-top: 4px; font-size: 10px; color: #666; word-break: break-all; }
            h1 { font-size: 18px; margin-bottom: 1cm; color: #1B2A4A; }
          </style>
        </head>
        <body>
          <h1>Laundri-Sync — Códigos QR</h1>
          <div class="grid">
            ${printRef.current.innerHTML}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          <\/script>
        </body>
      </html>
    `);
    win.document.close();
  }, []);

  return (
    <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
      <h1 className="font-serif text-2xl text-slate-900 mb-6">
        Generar Códigos QR
      </h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4 mb-8">
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1.5">
            Cantidad de QR a generar
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-24 px-3 py-2 bg-off-white border border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        </div>

        <button
          onClick={generate}
          disabled={generating}
          className="px-6 py-2.5 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy-light transition-colors disabled:opacity-40"
        >
          {generating ? "Generando y guardando..." : "Generar QR"}
        </button>

        {message && (
          <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
            {message}
          </p>
        )}

        {qrs.length > 0 && (
          <button
            onClick={handlePrint}
            className="ml-3 px-6 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold/90 transition-colors"
          >
            Imprimir
          </button>
        )}
      </div>

      {qrs.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div ref={printRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {qrs.map((qr) => (
              <div key={qr.id} className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qr.dataUrl}
                  alt={`QR ${qr.id}`}
                  className="w-full mx-auto"
                />
                <p className="mt-1 text-[10px] font-mono text-slate-400 break-all">
                  {qr.id}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function generateId(length = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
