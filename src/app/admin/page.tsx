"use client";

import { useEffect, useState, useCallback } from "react";
import type { OrderWithUser, BagWithUser } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  Pending: "Pendientes",
  Processing: "En Proceso",
  Ready: "Listos",
  Delivered: "Entregados",
};

const STATUS_ORDER = ["Pending", "Processing", "Ready", "Delivered"];

const STATUS_BG: Record<string, string> = {
  Pending: "bg-slate-50 border-slate-200",
  Processing: "bg-gold/[0.04] border-gold/20",
  Ready: "bg-green-50 border-green-200",
  Delivered: "bg-slate-50 border-slate-100",
};

const STATUS_BADGE: Record<string, string> = {
  Pending: "bg-slate-200 text-slate-700",
  Processing: "bg-gold/20 text-navy",
  Ready: "bg-green-200 text-green-800",
  Delivered: "bg-slate-200 text-slate-500",
};

const PREV_STATUS: Record<string, string> = {
  Processing: "Pending",
  Ready: "Processing",
  Delivered: "Ready",
};

const STATUS_ACTIONS: Record<string, { label: string; next: string; color: string }[]> = {
  Pending: [{ label: "Iniciar lavado", next: "Processing", color: "bg-gold text-white hover:bg-gold/90" }],
  Processing: [{ label: "Marcar listo", next: "Ready", color: "bg-green-600 text-white hover:bg-green-700" }],
  Ready: [{ label: "Confirmar entrega", next: "Delivered", color: "bg-navy text-white hover:bg-navy-light" }],
  Delivered: [],
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [bags, setBags] = useState<BagWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const res = await fetch("/api/admin/orders");
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
        setBags(data.bags ?? []);
      }
      setLoading(false);
    };

    load();
    const interval = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const refreshData = useCallback(async () => {
    const res = await fetch("/api/admin/orders");
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders ?? []);
      setBags(data.bags ?? []);
    }
  }, []);

  const updateStatus = useCallback(
    async (orderId: string, status: string) => {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      refreshData();
      if (data.whatsappSent) {
        setToast("📲 WhatsApp enviado al huésped");
        setTimeout(() => setToast(null), 4000);
      }
    },
    [refreshData]
  );

  const releaseBag = useCallback(
    async (qrId: string) => {
      if (!confirm("¿Liberar esta bolsa? El huésped se desvinculará.")) return;
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "liberar", qrId }),
      });
      if (res.ok) {
        window.location.reload();
      }
    },
    []
  );

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-gold rounded-full animate-spin" />
      </main>
    );
  }

  const filteredOrders = orders.filter((o) =>
    statusFilter ? o.status === statusFilter : true
  );

  const assignedBags = bags.filter((b) => b.status !== "Available" && b.user_id);

  return (
    <main className="flex-1 p-4 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-slate-900">Dashboard</h1>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Bolsones activos:</span>
          <span className="font-medium text-navy">{assignedBags.length}</span>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-green-600 px-5 py-3 text-sm text-white shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
        <button
          onClick={() => setStatusFilter(null)}
          className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            statusFilter === null
              ? "bg-navy text-white"
              : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
          }`}
        >
          Todas ({orders.length})
        </button>
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === s
                ? "bg-navy text-white"
                : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
            }`}
          >
            {STATUS_LABELS[s]} ({orders.filter((o) => o.status === s).length})
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredOrders.map((order) => (
          <div
            key={order.order_id}
            className={`rounded-2xl p-4 border ${STATUS_BG[order.status]} transition-all`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Hab. {order.users?.room_number}
                </p>
                <p className="text-xs text-slate-400">{order.users?.last_name}</p>
              </div>
              <span
                className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[order.status]}`}
              >
                {STATUS_LABELS[order.status]}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
              <span>{order.item_count} prendas</span>
              <span>{order.service_type}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                {new Date(order.created_at).toLocaleDateString("es-AR")}
              </span>
              <div className="flex gap-1">
                {STATUS_ACTIONS[order.status]?.map((action) => (
                  <button
                    key={action.next}
                    onClick={() => {
                      if (confirm(`¿${action.label}?`))
                        updateStatus(order.order_id, action.next);
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-medium ${action.color} transition-colors`}
                  >
                    {action.label}
                  </button>
                ))}
                {PREV_STATUS[order.status] && (
                  <button
                    onClick={() => {
                      if (confirm("¿Volver al estado anterior?"))
                        updateStatus(order.order_id, PREV_STATUS[order.status]);
                    }}
                    className="px-2 py-1 rounded-lg text-[10px] font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Volver"
                  >
                    ↩
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-16">
          <p className="text-slate-400 text-sm">No hay órdenes en esta categoría</p>
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-serif text-xl text-slate-900 mb-4">Gestión de Inventario</h2>
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left p-3 text-xs text-slate-400 font-medium uppercase tracking-wider">
                  QR
                </th>
                <th className="text-left p-3 text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Habitación
                </th>
                <th className="text-left p-3 text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-right p-3 text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {bags.map((bag) => (
                <tr key={bag.qr_id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="p-3 font-mono text-xs text-slate-600">
                    {bag.qr_id}
                  </td>
                  <td className="p-3 text-slate-900">
                    {bag.users ? `Hab. ${bag.users.room_number}` : "—"}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ${
                        bag.status === "Available"
                          ? "bg-slate-100 text-slate-500"
                          : bag.status === "Assigned"
                          ? "bg-gold/20 text-navy"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {bag.status === "Available"
                        ? "Disponible"
                        : bag.status === "Assigned"
                        ? "Asignado"
                        : "En lavandería"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => releaseBag(bag.qr_id)}
                      disabled={bag.status === "Available"}
                      className="text-[10px] px-3 py-1 rounded-lg font-medium text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Liberar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
