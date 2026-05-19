"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-slate-400 text-xs uppercase tracking-widest">
              Escanea tu código QR para comenzar
            </p>
            <div className="w-16 h-16 mx-auto opacity-20">
              <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="5" width="40" height="40" rx="4" />
                <rect x="55" y="5" width="40" height="40" rx="4" />
                <rect x="5" y="55" width="40" height="40" rx="4" />
                <rect x="55" y="55" width="40" height="40" rx="4" />
                <rect x="15" y="15" width="20" height="20" />
                <rect x="65" y="15" width="20" height="20" />
                <rect x="15" y="65" width="20" height="20" />
                <rect x="65" y="65" width="20" height="20" />
              </svg>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-off-white px-3 text-slate-400">
                o ingresalo manualmente
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ej: ABC12345"
              className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-center uppercase tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all"
              maxLength={10}
            />
            <button
              type="submit"
              disabled={!code.trim()}
              className="px-5 py-3 bg-navy text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-navy-light transition-colors"
            >
              Ir
            </button>
          </form>
        </div>

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
