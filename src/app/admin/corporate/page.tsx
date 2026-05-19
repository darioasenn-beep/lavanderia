"use client";

import { useEffect, useState, useCallback } from "react";
import type { CorporateDetails, OrderWithUser } from "@/lib/types";

export default function CorporatePage() {
  const [companies, setCompanies] = useState<CorporateDetails[]>([]);
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [items, setItems] = useState<{ employeeName: string; count: number }[]>([
    { employeeName: "", count: 1 },
  ]);
  const [serviceType, setServiceType] = useState<"Regular" | "Delicado">("Regular");
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState("");

  useEffect(() => {
    fetch("/api/admin/corporate")
      .then((r) => r.json())
      .then((d) => setCompanies(d.companies ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await fetch("/api/admin/orders");
      if (cancelled || !res.ok) return;
      const d = await res.json();
      setOrders(
        (d.orders ?? []).filter(
          (o: OrderWithUser) => o.profile_type === "CORPORATE"
        )
      );
    };
    load();
    const interval = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const addItem = () =>
    setItems([...items, { employeeName: "", count: 1 }]);

  const updateItem = (i: number, field: string, value: string | number) =>
    setItems(
      items.map((item, idx) =>
        idx === i ? { ...item, [field]: value } : item
      )
    );

  const removeItem = (i: number) =>
    setItems(items.filter((_, idx) => idx !== i));

  const handleSubmit = useCallback(async () => {
    if (!selectedCompany || items.length === 0) return;

    const res = await fetch("/api/admin/corporate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create-order",
        corporate_id: selectedCompany,
        items: items.map((i) => ({
          employee_name: i.employeeName || undefined,
          count: i.count,
        })),
        service_type: serviceType,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setResult(`${data.count} orden(es) creada(s)`);
      setItems([{ employeeName: "", count: 1 }]);
      const refresh = await fetch("/api/admin/orders");
      if (refresh.ok) {
        const d = await refresh.json();
        setOrders(
          (d.orders ?? []).filter(
            (o: OrderWithUser) => o.profile_type === "CORPORATE"
          )
        );
      }
    } else {
      const err = await res.json();
      setResult(`Error: ${err.error}`);
    }
  }, [selectedCompany, items, serviceType]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-gold rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 max-w-6xl mx-auto w-full">
      <h1 className="font-serif text-2xl text-slate-900 mb-6">
        Módulo Empresa
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
          <h2 className="font-serif text-lg text-navy">Carga por Lote</h2>

          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1.5">
              Empresa
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-4 py-3 bg-off-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
            >
              <option value="">Seleccionar empresa...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.cuit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-2">
              Tipo de servicio
            </label>
            <div className="flex gap-2">
              {(["Regular", "Delicado"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setServiceType(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    serviceType === t
                      ? "bg-navy text-white border-navy"
                      : "bg-off-white text-slate-600 border-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wide">
                Prendas por empleado
              </span>
              <button
                onClick={addItem}
                className="text-xs text-gold hover:text-gold/80 font-medium"
              >
                + Agregar
              </button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={item.employeeName}
                  onChange={(e) => updateItem(i, "employeeName", e.target.value)}
                  placeholder="Empleado"
                  className="flex-1 px-3 py-2 bg-off-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
                <input
                  type="number"
                  min={1}
                  value={item.count}
                  onChange={(e) =>
                    updateItem(i, "count", Number(e.target.value))
                  }
                  className="w-16 px-3 py-2 bg-off-white border border-slate-200 rounded-xl text-xs text-center focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(i)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selectedCompany || items.length === 0}
            className="w-full py-3 bg-gold text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gold/90 transition-colors"
          >
            Crear Órdenes
          </button>

          {result && (
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              {result}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="font-serif text-lg text-navy mb-4">
            Órdenes Corporativas
          </h2>
          {orders.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              No hay órdenes corporativas
            </p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {orders.map((o) => (
                <div
                  key={o.order_id}
                  className="flex items-center justify-between p-3 bg-off-white rounded-xl"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {o.corporate_details?.name ?? "Corp"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {o.item_count} prendas · {o.service_type}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-medium ${
                      o.status === "Pending"
                        ? "bg-slate-200 text-slate-700"
                        : o.status === "Processing"
                        ? "bg-gold/20 text-navy"
                        : o.status === "Ready"
                        ? "bg-green-200 text-green-800"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {o.status === "Pending"
                      ? "Pendiente"
                      : o.status === "Processing"
                      ? "Proceso"
                      : o.status === "Ready"
                      ? "Listo"
                      : "Entregado"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
