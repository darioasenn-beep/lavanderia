"use client";

import { useState, useCallback } from "react";

export default function POSPage() {
  const [tab, setTab] = useState<"sale" | "link" | "promo">("sale");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [itemCount, setItemCount] = useState(1);
  const [serviceType, setServiceType] = useState<"Regular" | "Delicado">("Regular");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "MercadoPago" | "Transfer">("Cash");
  const [qrId, setQrId] = useState("");
  const [userId, setUserId] = useState("");
  const [searchUserId, setSearchUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [promoInfo, setPromoInfo] = useState<{
    total_orders: number;
    free_available: number;
    next_free_at: number;
  } | null>(null);

  const handleQuickSale = useCallback(async () => {
    if (!name.trim() || itemCount < 1) return;
    setLoading(true);
    setResult("");
    const res = await fetch("/api/admin/pos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "quick-sale",
        name: name.trim(),
        phone: phone.trim() || undefined,
        item_count: itemCount,
        service_type: serviceType,
        payment_method: paymentMethod,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setResult(`Venta creada: ${data.order?.order_id?.slice(0, 8)}`);
      setName("");
      setPhone("");
      setItemCount(1);
    } else {
      setResult(`Error: ${data.error}`);
    }
    setLoading(false);
  }, [name, phone, itemCount, serviceType, paymentMethod]);

  const handleLinkBag = useCallback(async () => {
    if (!qrId.trim() || !userId.trim()) return;
    setLoading(true);
    setResult("");
    const res = await fetch("/api/admin/pos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "link-bag", qr_id: qrId.trim(), user_id: userId.trim() }),
    });
    const data = await res.json();
    setResult(res.ok ? `Bolsa ${qrId} vinculada` : `Error: ${data.error}`);
    if (res.ok) {
      setQrId("");
      setUserId("");
    }
    setLoading(false);
  }, [qrId, userId]);

  const handleCheckPromo = useCallback(async () => {
    if (!searchUserId.trim()) return;
    setLoading(true);
    setResult("");
    const res = await fetch("/api/admin/pos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "promotion-check", user_id: searchUserId.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setPromoInfo({
        total_orders: data.promotion?.total_orders ?? 0,
        free_available: data.free_available ?? 0,
        next_free_at: data.next_free_at ?? 10,
      });
    } else {
      setResult(`Error: ${data.error}`);
    }
    setLoading(false);
  }, [searchUserId]);

  return (
    <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
      <h1 className="font-serif text-2xl text-slate-900 mb-6">
        Terminal POS
      </h1>

      <div className="flex gap-2 mb-6">
        {([
          { key: "sale", label: "Venta Rápida" },
          { key: "link", label: "Vincular QR" },
          { key: "promo", label: "Promociones" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              tab === t.key
                ? "bg-navy text-white"
                : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "sale" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1.5">
              Nombre del cliente
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre y apellido"
              className="w-full px-4 py-3 bg-off-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1.5">
              Teléfono (opcional)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="11 1234-5678"
              className="w-full px-4 py-3 bg-off-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1.5">
              Prendas
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setItemCount(Math.max(1, itemCount - 1))}
                className="w-10 h-10 rounded-xl bg-off-white border border-slate-200 text-slate-600 text-lg"
              >
                -
              </button>
              <span className="text-2xl font-medium text-navy w-12 text-center tabular-nums">
                {itemCount}
              </span>
              <button
                onClick={() => setItemCount(Math.min(100, itemCount + 1))}
                className="w-10 h-10 rounded-xl bg-off-white border border-slate-200 text-slate-600 text-lg"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-2">
              Servicio
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
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-2">
              Pago
            </label>
            <div className="flex gap-2">
              {(["Cash", "MercadoPago", "Transfer"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    paymentMethod === m
                      ? "bg-navy text-white border-navy"
                      : "bg-off-white text-slate-600 border-slate-200"
                  }`}
                >
                  {m === "Cash" ? "Efectivo" : m === "MercadoPago" ? "M. Pago" : "Transferencia"}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleQuickSale}
            disabled={loading || !name.trim()}
            className="w-full py-3 bg-gold text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gold/90 transition-colors"
          >
            {loading ? "Procesando..." : "Confirmar Venta"}
          </button>
          {result && (
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              {result}
            </p>
          )}
        </div>
      )}

      {tab === "link" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
          <p className="text-sm text-slate-600">
            Vinculá una bolsa física a un cliente existente.
          </p>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1.5">
              Código QR de la bolsa
            </label>
            <input
              type="text"
              value={qrId}
              onChange={(e) => setQrId(e.target.value)}
              placeholder="ABC12345"
              className="w-full px-4 py-3 bg-off-white border border-slate-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1.5">
              ID de usuario
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="UUID del usuario"
              className="w-full px-4 py-3 bg-off-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <button
            onClick={handleLinkBag}
            disabled={loading || !qrId.trim() || !userId.trim()}
            className="w-full py-3 bg-navy text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-navy-light transition-colors"
          >
            {loading ? "Vinculando..." : "Vincular Bolsa"}
          </button>
          {result && (
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              {result}
            </p>
          )}
        </div>
      )}

      {tab === "promo" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
          <p className="text-sm text-slate-600">
            Consultá el estado de promociones de un cliente (cada 10 lavados, 1 gratis).
          </p>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1.5">
              ID de usuario
            </label>
            <input
              type="text"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              placeholder="UUID del usuario"
              className="w-full px-4 py-3 bg-off-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <button
            onClick={handleCheckPromo}
            disabled={loading || !searchUserId.trim()}
            className="w-full py-3 bg-navy text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-navy-light transition-colors"
          >
            {loading ? "Consultando..." : "Consultar"}
          </button>
          {promoInfo && (
            <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Lavados realizados</span>
                <span className="font-medium text-navy">{promoInfo.total_orders}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Lavados gratis disponibles</span>
                <span className="font-medium text-gold">{promoInfo.free_available}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Próximo gratis en</span>
                <span className="font-medium text-navy">{promoInfo.next_free_at} lavados</span>
              </div>
            </div>
          )}
          {result && (
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              {result}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
