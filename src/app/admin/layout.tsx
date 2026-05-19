"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";

const AdminContext = createContext<{ logout: () => void }>({ logout: () => {} });
export const useAdmin = () => useContext(AdminContext);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((d) => setAuthenticated(d.authenticated))
      .catch(() => setAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = useCallback(async () => {
    setError("");
    const res = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError("Contraseña incorrecta");
      return;
    }
    setAuthenticated(true);
  }, [password]);

  const logout = useCallback(() => {
    fetch("/api/admin/logout").then(() => setAuthenticated(false));
  }, []);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-gold rounded-full animate-spin" />
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-xs w-full">
          <h1 className="font-serif text-2xl text-slate-900 text-center mb-8">
            Administración
          </h1>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full px-4 py-3 bg-off-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            {error && (
              <p className="text-red-500 text-xs text-center">{error}</p>
            )}
            <button
              onClick={handleLogin}
              className="w-full py-3 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy-light transition-colors"
            >
              Ingresar
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <AdminContext.Provider value={{ logout }}>
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/admin" className="font-serif text-lg text-navy">
              Laundri-Sync
            </a>
            <nav className="flex items-center gap-4 text-sm">
              <a
                href="/admin"
                className="text-slate-400 hover:text-navy transition-colors"
              >
                Dashboard
              </a>
              <a
                href="/admin/corporate"
                className="text-slate-400 hover:text-navy transition-colors"
              >
                Empresa
              </a>
              <a
                href="/admin/b2b"
                className="text-slate-400 hover:text-navy transition-colors"
              >
                B2B
              </a>
              <a
                href="/admin/pos"
                className="text-slate-400 hover:text-navy transition-colors"
              >
                POS
              </a>
              <a
                href="/admin/print-qrs"
                className="text-slate-400 hover:text-navy transition-colors"
              >
                QR
              </a>
              <button
                onClick={logout}
                className="text-slate-400 hover:text-red-500 transition-colors text-xs"
              >
                Salir
              </button>
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </AdminContext.Provider>
  );
}
