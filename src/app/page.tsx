"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrScanner } from "@/components/qr-scanner";

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed) router.push(`/q/${trimmed}`);
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md mx-auto w-full">
        <h1 className="font-serif text-5xl tracking-wide text-slate-900 mb-3">
          Laundri-Sync
        </h1>
        <p className="text-slate-500 text-sm mb-12 leading-relaxed">
          Servicio de lavandería boutique para huéspedes
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ej: ABC12345"
            className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-center uppercase tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all"
            maxLength={10}
          />
          <QrScanner onCode={(c) => router.push(`/q/${c}`)} />
          <button
            type="submit"
            disabled={!code.trim()}
            className="px-5 py-3 bg-navy text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-navy-light transition-colors"
          >
            Ir
          </button>
        </form>

        <div className="mt-16 pt-8 border-t border-slate-200">
          <a
            href="/admin"
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Acceso administrativo
          </a>
        </div>
      </div>
    </main>
  );
}
