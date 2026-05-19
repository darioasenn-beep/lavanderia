"use client";

import { useEffect, useState, useCallback } from "react";
import type { Company, CorporateRemito, RemitoItem } from "@/lib/types";
import { formatRemitoNumber } from "@/lib/types";

interface CatalogItem {
  id: string;
  company_id: string;
  item_description: string;
}

export default function B2BPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [remitos, setRemitos] = useState<(CorporateRemito & { companies?: Pick<Company, "name"> })[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddCompany, setShowAddCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState({ name: "", razon_social: "", cuit: "", address: "" });

  const [newItemDesc, setNewItemDesc] = useState("");

  const [remitoItems, setRemitoItems] = useState<RemitoItem[]>([]);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState("");
  const [remitoQty, setRemitoQty] = useState(1);
  const [resultMsg, setResultMsg] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const loadCompanies = useCallback(async () => {
    const res = await fetch("/api/admin/b2b/companies");
    if (res.ok) {
      const d = await res.json();
      setCompanies(d.companies ?? []);
    }
  }, []);

  const loadRemitos = useCallback(async () => {
    const res = await fetch("/api/admin/b2b/remitos");
    if (res.ok) {
      const d = await res.json();
      setRemitos(d.remitos ?? []);
    }
  }, []);

  const loadCatalog = useCallback(async (companyId: string) => {
    const res = await fetch(`/api/admin/b2b/companies/${companyId}/price-lists`);
    if (res.ok) {
      const d = await res.json();
      setCatalog(d.price_list ?? []);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadCompanies(), loadRemitos()]).finally(() => setLoading(false));
  }, [loadCompanies, loadRemitos]);

  useEffect(() => {
    if (selectedCompany) {
      loadCatalog(selectedCompany.id);
    } else {
      setCatalog([]);
    }
  }, [selectedCompany, loadCatalog]);

  const handleCreateCompany = async () => {
    const { name, razon_social, cuit, address } = companyForm;
    if (!name || !razon_social || !cuit || !address) return;
    const res = await fetch("/api/admin/b2b/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(companyForm),
    });
    if (res.ok) {
      setCompanyForm({ name: "", razon_social: "", cuit: "", address: "" });
      setShowAddCompany(false);
      await loadCompanies();
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!confirm("¿Eliminar esta empresa?")) return;
    const res = await fetch(`/api/admin/b2b/companies/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (selectedCompany?.id === id) setSelectedCompany(null);
      await loadCompanies();
    }
  };

  const handleAddCatalogItem = async () => {
    if (!selectedCompany || !newItemDesc) return;
    const res = await fetch(`/api/admin/b2b/companies/${selectedCompany.id}/price-lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_description: newItemDesc, unit_price: 0 }),
    });
    if (res.ok) {
      setNewItemDesc("");
      const d = await res.json();
      setCatalog((prev) => [...prev, d.price_item]);
    }
  };

  const handleDeleteCatalogItem = async (id: string) => {
    const res = await fetch(`/api/admin/b2b/price-lists/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCatalog((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const addRemitoItemFromCatalog = () => {
    if (!selectedCatalogItem) return;
    const item = catalog.find((p) => p.id === selectedCatalogItem);
    if (!item) return;
    setRemitoItems((prev) => [
      ...prev,
      { description: item.item_description, quantity: remitoQty, unit_price: 0, subtotal: 0 },
    ]);
    setSelectedCatalogItem("");
    setRemitoQty(1);
  };

  const removeRemitoItem = (idx: number) => {
    setRemitoItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateRemito = async () => {
    if (!selectedCompany || remitoItems.length === 0) return;
    const res = await fetch("/api/admin/b2b/remitos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_id: selectedCompany.id,
        items: remitoItems,
      }),
    });
    if (res.ok) {
      setResultMsg("Remito creado exitosamente");
      setRemitoItems([]);
      await loadRemitos();
    } else {
      const err = await res.json();
      setResultMsg(`Error: ${err.error}`);
    }
  };

  const handleDeleteRemito = async (id: string) => {
    if (deletePassword !== "coquito") {
      setDeleteError("Clave incorrecta");
      return;
    }
    setDeleteTarget(null);
    setDeletePassword("");
    setDeleteError("");
    const res = await fetch(`/api/admin/b2b/remitos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setResultMsg("Remito eliminado");
      await loadRemitos();
    } else {
      const err = await res.json();
      setResultMsg(`Error: ${err.error}`);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-gold rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 max-w-6xl mx-auto w-full">
      <h1 className="font-serif text-2xl text-slate-900 mb-6">Módulo B2B</h1>

      {resultMsg && (
        <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-4 py-2 mb-4">{resultMsg}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Companies Column ── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg text-navy">Empresas</h2>
            <button
              onClick={() => setShowAddCompany(!showAddCompany)}
              className="text-xs text-gold hover:text-gold/80 font-medium"
            >
              {showAddCompany ? "Cancelar" : "+ Nueva"}
            </button>
          </div>

          {showAddCompany && (
            <div className="space-y-2 p-3 bg-off-white rounded-xl border border-slate-200">
              <input
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                placeholder="Nombre de fantasía"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
              <input
                value={companyForm.razon_social}
                onChange={(e) => setCompanyForm({ ...companyForm, razon_social: e.target.value })}
                placeholder="Razón social"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
              <input
                value={companyForm.cuit}
                onChange={(e) => setCompanyForm({ ...companyForm, cuit: e.target.value })}
                placeholder="CUIT (sin guiones)"
                maxLength={11}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
              <input
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                placeholder="Dirección"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
              <button
                onClick={handleCreateCompany}
                disabled={!companyForm.name || !companyForm.razon_social || !companyForm.cuit || !companyForm.address}
                className="w-full py-2 bg-navy text-white rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-navy-light transition-colors"
              >
                Guardar
              </button>
            </div>
          )}

          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {companies.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCompany(c)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors text-sm ${
                  selectedCompany?.id === c.id
                    ? "bg-gold/10 border border-gold/30"
                    : "bg-off-white hover:bg-slate-100 border border-transparent"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{c.name}</p>
                  <p className="text-[10px] text-slate-400">CUIT: {c.cuit}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCompany(c.id);
                  }}
                  className="text-red-400 hover:text-red-600 text-xs ml-2 shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
            {companies.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No hay empresas</p>
            )}
          </div>
        </div>

        {/* ── Items Catalog Column ── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h2 className="font-serif text-lg text-navy">
            {selectedCompany ? `Items: ${selectedCompany.name}` : "Catálogo de Items"}
          </h2>

          {!selectedCompany ? (
            <p className="text-xs text-slate-400 text-center py-4">Seleccioná una empresa</p>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="Nuevo item"
                  className="flex-1 px-3 py-2 bg-off-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
                <button
                  onClick={handleAddCatalogItem}
                  disabled={!newItemDesc}
                  className="px-3 py-2 bg-gold text-white rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-gold/90 transition-colors"
                >
                  +
                </button>
              </div>

              <div className="space-y-1 max-h-[350px] overflow-y-auto">
                {catalog.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 bg-off-white rounded-xl text-sm"
                  >
                    <span className="text-slate-900">{p.item_description}</span>
                    <button
                      onClick={() => handleDeleteCatalogItem(p.id)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {catalog.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">
                    Sin items cargados
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Remitos Column ── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h2 className="font-serif text-lg text-navy">Remitos</h2>

          {!selectedCompany ? (
            <p className="text-xs text-slate-400 text-center py-4">Seleccioná una empresa</p>
          ) : (
            <>
              {/* Add items from catalog */}
              <div className="flex gap-2">
                <select
                  value={selectedCatalogItem}
                  onChange={(e) => setSelectedCatalogItem(e.target.value)}
                  className="flex-1 px-3 py-2 bg-off-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gold/30"
                >
                  <option value="">Seleccionar item...</option>
                  {catalog.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.item_description}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={remitoQty}
                  onChange={(e) => setRemitoQty(Number(e.target.value))}
                  className="w-14 px-2 py-2 bg-off-white border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
                <button
                  onClick={addRemitoItemFromCatalog}
                  disabled={!selectedCatalogItem}
                  className="px-3 py-2 bg-navy text-white rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-navy-light transition-colors"
                >
                  +
                </button>
              </div>

              {/* Items list for current remito */}
              {remitoItems.length > 0 && (
                <div className="space-y-1">
                  {remitoItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-off-white rounded-lg text-xs"
                    >
                      <span className="text-slate-700">{item.description}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500">x{item.quantity}</span>
                        <button
                          onClick={() => removeRemitoItem(idx)}
                          className="text-red-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={handleCreateRemito}
                    className="w-full py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold/90 transition-colors"
                  >
                    Crear Remito
                  </button>
                </div>
              )}

              {/* Recent remitos */}
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs text-slate-400 uppercase tracking-wide mb-3">
                  Remitos recientes
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {remitos
                    .filter((r) => r.company_id === selectedCompany.id)
                    .map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-3 bg-off-white rounded-xl text-xs"
                      >
                        <div>
                          <p className="text-slate-900 font-medium font-mono text-[11px]">
                            {formatRemitoNumber(r.remito_number)}
                          </p>
                          <p className="text-slate-400">
                            {new Date(r.created_at).toLocaleDateString("es-AR")}
                          </p>
                          <div className="mt-1 space-y-0.5">
                            {(r.items as RemitoItem[]).map((item, idx) => (
                              <p key={idx} className="text-[10px] text-slate-500">
                                {item.description}{" "}
                                <span className="font-mono text-slate-400">x{item.quantity}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={`/admin/b2b/remitos/${r.id}`}
                            className="text-[10px] px-2 py-1 rounded-lg font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                          >
                            Ver
                          </a>
                          <button
                            onClick={() => setDeleteTarget(r.id)}
                            className="text-[10px] px-2 py-1 rounded-lg font-medium bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          >
                            Eliminar
                          </button>
                          <span
                            className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-medium ${
                              r.status === "Pending"
                                ? "bg-slate-200 text-slate-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {r.status === "Pending" ? "Pendiente" : "Entregado"}
                          </span>
                          {r.billed_at && (
                            <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              Fact.
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  {remitos.filter((r) => r.company_id === selectedCompany.id).length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">
                      Sin remitos aún
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Confirm Delete Remito Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 w-full max-w-xs mx-4 space-y-4">
            <h3 className="font-serif text-lg text-navy">Eliminar remito</h3>
            <p className="text-xs text-slate-500">
              Remito{" "}
              <span className="font-mono font-medium text-slate-700">
                {formatRemitoNumber(
                  remitos.find((r) => r.id === deleteTarget)?.remito_number ?? 0
                )}
              </span>
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(""); }}
              placeholder="Clave de seguridad"
              onKeyDown={(e) => e.key === "Enter" && handleDeleteRemito(deleteTarget)}
              className="w-full px-3 py-2 bg-off-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            {deleteError && (
              <p className="text-red-500 text-[10px]">{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setDeleteTarget(null); setDeletePassword(""); setDeleteError(""); }}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteRemito(deleteTarget)}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
