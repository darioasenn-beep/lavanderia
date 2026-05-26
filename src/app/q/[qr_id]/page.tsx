"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { getPickupInfo, formatDate } from "@/lib/utils";
import type { BagWithUser, Order } from "@/lib/types";

type ViewState = "loading" | "unassigned" | "assigned" | "order-form" | "error";

export default function QRPage() {
  const { qr_id } = useParams<{ qr_id: string }>();
  const [view, setView] = useState<ViewState>("loading");
  const [bag, setBag] = useState<BagWithUser | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [itemCount, setItemCount] = useState(1);
  const [serviceType, setServiceType] = useState<"Regular" | "Delicado">("Regular");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const res = await fetch(`/api/qr/${qr_id}`);
      const data = await res.json();
      if (cancelled) return;

      if (data.error) {
        setErrorMsg(data.error);
        setView("error");
        return;
      }

      setBag(data.bag);
      setOrder(data.latestOrder);

      if (data.bag.status === "Available") {
        localStorage.removeItem(`laundri_user_${qr_id}`);
        localStorage.removeItem(`laundri_form_${qr_id}`);
        setView("unassigned");
        return;
      }

      if (data.bag.user_id) {
        setView("assigned");
      } else {
        const saved = localStorage.getItem(`laundri_form_${qr_id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setRoomNumber(parsed.roomNumber ?? "");
          setLastName(parsed.lastName ?? "");
          setPhone(parsed.phone ?? "");
        }
        setView("unassigned");
      }
    };

    load();

    const interval = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [qr_id]);

  const handleLink = useCallback(async () => {
    if (!roomNumber.trim() || !lastName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/qr/${qr_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_number: roomNumber.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.error);
        return;
      }
      localStorage.setItem(`laundri_user_${qr_id}`, JSON.stringify(data.user));
      const bagRes = await fetch(`/api/qr/${qr_id}`);
      const bagData = await bagRes.json();
      if (!bagData.error) {
        setBag(bagData.bag);
        setOrder(bagData.latestOrder);
      }
      setView("assigned");
    } finally {
      setSubmitting(false);
    }
  }, [qr_id, roomNumber, lastName, phone]);

  const handleSubmitOrder = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_id, item_count: itemCount, service_type: serviceType }),
      });
      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.error);
        return;
      }
      setOrder(data.order);
      setView("assigned");
    } finally {
      setSubmitting(false);
    }
  }, [qr_id, itemCount, serviceType]);

  const pickupInfo = getPickupInfo();

  if (view === "loading") {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-gold rounded-full animate-spin" />
      </main>
    );
  }

  if (view === "error") {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="font-serif text-2xl text-slate-900 mb-2">Código no válido</h1>
        <p className="text-slate-500 text-sm">{errorMsg}</p>
      </main>
    );
  }

  if (view === "unassigned") {
    return (
      <main className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-slate-900 mb-1">
            Bienvenido
          </h1>
          <p className="text-slate-400 text-xs uppercase tracking-widest">
            Servicio de lavandería boutique
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
          <p className="text-sm text-slate-600 leading-relaxed text-center">
            Para vincular esta bolsa a tu habitación, ingresá tus datos:
          </p>

          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1.5">
              Número de Habitación
            </label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="Ej: 101"
              className="w-full px-4 py-3 bg-off-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1.5">
              Apellido
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ej: García"
              className="w-full px-4 py-3 bg-off-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1.5">
              WhatsApp <span className="text-slate-300">(opcional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: +54 11 5555-1234"
              className="w-full px-4 py-3 bg-off-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all"
            />
          </div>

          <button
            onClick={handleLink}
            disabled={submitting || !roomNumber.trim() || !lastName.trim()}
            className="w-full py-3 bg-navy text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-navy-light transition-colors"
          >
            {submitting ? "Vinculando..." : "Vincular Bolsa"}
          </button>
        </div>
      </main>
    );
  }

  if (view === "order-form") {
    return (
      <main className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-slate-900 mb-1">
            Nuevo Pedido
          </h1>
          <p className="text-slate-400 text-xs uppercase tracking-widest">
            Habitación {bag?.users?.room_number ?? ""}
          </p>
        </div>

        <div
          className={`rounded-2xl p-4 mb-6 text-sm ${
            pickupInfo.isToday
              ? "bg-gold/10 border border-gold/20 text-navy"
              : "bg-slate-100 border border-slate-200 text-slate-600"
          }`}
        >
          {pickupInfo.isToday
            ? "Hoy es día de retiro — los pedidos se procesan hoy."
            : `Próximo día de retiro: ${formatDate(pickupInfo.nextDate)}`}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1.5">
              Cantidad de prendas
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setItemCount(Math.max(1, itemCount - 1))}
                className="w-10 h-10 rounded-xl bg-off-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors text-lg"
              >
                -
              </button>
              <span className="text-2xl font-medium text-navy w-12 text-center tabular-nums">
                {itemCount}
              </span>
              <button
                onClick={() => setItemCount(Math.min(50, itemCount + 1))}
                className="w-10 h-10 rounded-xl bg-off-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors text-lg"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-2">
              Tipo de servicio
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["Regular", "Delicado"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setServiceType(type)}
                  className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all ${
                    serviceType === type
                      ? "bg-navy text-white border-navy"
                      : "bg-off-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmitOrder}
            disabled={submitting}
            className="w-full py-3 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold/90 transition-colors disabled:opacity-40"
          >
            {submitting ? "Enviando..." : "Solicitar Pedido"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        <h1 className="font-serif text-3xl text-slate-900 mb-1">
          ¡Hola!
        </h1>
        <p className="text-slate-400 text-xs uppercase tracking-widest">
          Habitación {bag?.users?.room_number ?? ""}
        </p>
      </div>

      {order && order.status !== "Delivered" ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">
            Estado de tu pedido
          </p>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-3 ${
            order.status === "Ready"
              ? "bg-green-100 text-green-700"
              : order.status === "Processing"
              ? "bg-gold/10 text-navy"
              : "bg-slate-100 text-slate-600"
          }`}>
            {order.status === "Pending" && "Pendiente"}
            {order.status === "Processing" && "En proceso"}
            {order.status === "Ready" && "Listo para retirar"}
          </div>
          <p className="text-sm text-slate-500">
            {order.item_count} prendas · {order.service_type}
          </p>
          {order.status === "Ready" && order.payment_status !== "Paid" && (
            <button
              onClick={async () => {
                const res = await fetch("/api/payments/create-preference", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ order_id: order.order_id }),
                });
                const data = await res.json();
                if (data.init_point) {
                  window.location.href = data.init_point;
                }
              }}
              className="mt-4 w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Pagar con Mercado Pago
            </button>
          )}
          {order.payment_status === "Paid" && (
            <p className="mt-3 text-xs text-green-600 font-medium">
              ✓ Pagado
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center space-y-4">
          <p className="text-sm text-slate-500">
            {order ? "Tu último pedido fue entregado. Podés hacer uno nuevo." : "No tenés pedidos activos."}
          </p>
          <button
            onClick={() => setView("order-form")}
            className="px-6 py-3 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold/90 transition-colors"
          >
            Nuevo Pedido
          </button>
        </div>
      )}
    </main>
  );
}
