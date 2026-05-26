"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { CorporateRemito, Company, RemitoItem } from "@/lib/types";
import { formatRemitoNumber } from "@/lib/types";

type RemitoWithCompany = CorporateRemito & { companies: Company };

export default function RemitoViewPage() {
  const params = useParams();
  const [remito, setRemito] = useState<RemitoWithCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/admin/b2b/remitos/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Error al obtener el remito");
        return r.json();
      })
      .then((d) => {
        if (d.remito) setRemito(d.remito);
        else setError("Remito no encontrado");
      })
      .catch(() => setError("Error al cargar"))
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-gold rounded-full animate-spin" />
      </main>
    );
  }

  if (error || !remito) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <p className="text-slate-400 text-sm">{error || "No encontrado"}</p>
      </main>
    );
  }

  const c = remito.companies;
  const items = (remito.items as RemitoItem[]) || [];
  const num = formatRemitoNumber(remito.remito_number);
  const dateStr = new Date(remito.created_at).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  const handlePrint = () => {
    const rows = items
      .map(
        (item, idx) => `
          <tr${idx % 2 === 1 ? ' style="background:#f9fafb;-webkit-print-color-adjust:exact;print-color-adjust:exact"' : ''}>
            <td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;font-size:7.5pt;color:#374151;text-align:center;width:32px">${idx + 1}</td>
            <td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;font-size:7.5pt;color:#374151">${item.description}</td>
            <td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;font-size:7.5pt;color:#374151;text-align:right;font-weight:600;width:64px">${item.quantity}</td>
          </tr>`
      )
      .join("");

    const obsLines = Array.from(
      { length: 2 },
      () => `<div style="height:28px;border-bottom:1px solid #e5e5e5"></div>`
    ).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Remito ${num}</title>
  <style>
    @page { size: A5 portrait; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      margin: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    #page {
      width: 148mm;
      height: 210mm;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      box-sizing: border-box;
      overflow: hidden;
      position: relative;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    #content {
      position: relative;
      z-index: 10;
      width: 100%;
      height: 100%;
      padding: 12mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
    }
    table { width: 100%; border-collapse: collapse; }
    thead tr {
      background: #9ca3af;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    #content tbody tr:nth-child(even) {
      background: #f9fafb;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  </style>
</head>
<body>
  <div id="page">
    <div id="content">

      <!-- TOP: Header + Client -->
      <div>

        <!-- 3-COL HEADER -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;position:relative">

          <!-- LEFT: Logo + emitter data -->
          <div style="display:flex;align-items:center;gap:12px">
            <img src="${origin}/logo.svg" alt="" style="width:48px;height:48px;border-radius:50%;object-fit:contain;display:block;flex-shrink:0" />
            <div style="font-size:7.5pt;line-height:1.25;color:#374151">
              <div style="font-weight:700">Lavander\u00eda ACME</div>
              <div>20-28307309-3</div>
              <div>Juncal 79, Mart\u00ednez</div>
              <div style="margin-top:2px">lavaderoacme@outlook.com</div>
            </div>
          </div>

          <!-- CENTER: R badge — absolutely centered on page -->
          <div style="position:absolute;left:50%;top:0;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center">
            <div style="width:40px;height:40px;border:1px solid #d1d5db;background:#f3f4f6;display:flex;align-items:center;justify-content:center;-webkit-print-color-adjust:exact;print-color-adjust:exact">
              <span style="font-size:13.5pt;font-weight:700;color:#000;line-height:1">R</span>
            </div>
            <div style="font-size:6.75pt;color:#9ca3af;margin-top:2px;letter-spacing:0.5px">C\u00d3D. 91</div>
          </div>

          <!-- RIGHT: Remito info -->
          <div style="text-align:right">
            <div style="font-size:13.5pt;font-weight:700;letter-spacing:0.1em;color:#000">REMITO</div>
            <div style="font-size:9pt;font-weight:600;color:#1f2937;margin-top:2px">N\u00b0 ${num}</div>
            <div style="font-size:8.25pt;color:#6b7280;margin-top:2px">Fecha: ${dateStr}</div>
          </div>
        </div>

        <!-- DIVIDER -->
        <div style="border-top:1px solid #e5e5e5;margin-top:12px;margin-bottom:8px"></div>

        <!-- CLIENT -->
        <div>
          <div style="font-size:7.5pt;font-weight:500;letter-spacing:0.1em;color:#9ca3af;text-transform:uppercase">DESTINATARIO / CLIENTE</div>
          <div style="font-size:12pt;font-weight:700;color:#111827;margin-top:2px">${c.name}</div>
          <div style="font-size:9pt;color:#4b5563;line-height:1.5">
            <div>CUIT: ${c.cuit}</div>
            <div>${c.address}</div>
          </div>
        </div>
      </div>

      <!-- MIDDLE: Table + Total -->
      <div style="flex:1;min-height:0;display:flex;flex-direction:column">
        <div style="flex:1">
          <table>
            <thead>
              <tr>
                <th style="padding:4px 8px;font-size:7.5pt;font-weight:700;letter-spacing:0.1em;color:#fff;text-align:center;width:32px">#</th>
                <th style="padding:4px 8px;font-size:7.5pt;font-weight:700;letter-spacing:0.1em;color:#fff;text-align:left">Descripci\u00f3n del Servicio / Prendas</th>
                <th style="padding:4px 8px;font-size:7.5pt;font-weight:700;letter-spacing:0.1em;color:#fff;text-align:right;width:64px">Cant.</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div style="font-size:9pt;font-weight:700;color:#111827;margin-top:8px;text-align:right">Total de \u00edtems: ${totalQty}</div>
      </div>

      <!-- BOTTOM: Observations + Signature + Legal -->
      <div>
        <div style="font-size:7.5pt;font-weight:700;letter-spacing:0.1em;color:#9ca3af;text-transform:uppercase;margin-bottom:4px">OBSERVACIONES / DETALLES DEL LOTE</div>
        ${obsLines}
        <div style="height:36px"></div>
        <div style="width:33.33%;border-top:1px solid #9ca3af;margin:0 auto"></div>
        <div style="font-size:7.5pt;text-transform:uppercase;letter-spacing:0.2em;color:#6b7280;margin-top:4px;text-align:center">Recib\u00ed conforme</div>
        <div style="font-size:6.75pt;color:#9ca3af;letter-spacing:0.1em;text-align:center;margin-top:8px">DOCUMENTO NO V\u00c1LIDO COMO FACTURA</div>
      </div>

    </div>
  </div>
  <script>
    window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 300); }
  <\/script>
</body>
</html>`;

    const pw = window.open("", "_blank");
    if (!pw) return;
    pw.document.open();
    pw.document.write(html);
    pw.document.close();
  };

  return (
    <main className="flex-1 p-4 flex flex-col items-center">
      <div className="no-print flex items-center justify-between mb-4 w-full max-w-[148mm]">
        <a
          href="/admin/b2b"
          className="text-xs text-slate-400 hover:text-navy transition-colors"
        >
          &larr; Volver a B2B
        </a>
        <button
          onClick={handlePrint}
          className="px-5 py-2 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy-light transition-colors"
        >
          Imprimir
        </button>
      </div>

      <div
        className="w-[148mm] h-[210mm] max-w-[148mm] max-h-[210mm] bg-white text-slate-900 box-border overflow-hidden shadow-sm mx-auto rounded-2xl border border-slate-200 relative"
        style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
      >
        <div className="relative z-10 w-full h-full p-[12mm] flex flex-col justify-between box-border">

          {/* TOP: Header + Client */}
          <div>
            {/* 3-COL HEADER */}
            <div className="flex justify-between items-start relative">
              {/* LEFT: Logo + emitter data */}
              <div className="flex items-center gap-3">
                <img
                  src="/logo.svg"
                  alt=""
                  className="h-12 w-12 object-contain rounded-full shrink-0"
                />
                <div className="text-[10px] leading-tight text-gray-700">
                  <div className="font-bold">Lavander&iacute;a ACME</div>
                  <div>20-28307309-3</div>
                  <div>Juncal 79, Mart&iacute;nez</div>
                  <div className="mt-[2px]">lavaderoacme@outlook.com</div>
                </div>
              </div>

              {/* CENTER: R badge — absolutely centered on page */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center">
                <div
                  className="w-10 h-10 border border-gray-300 bg-gray-100 flex items-center justify-center"
                  style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                >
                  <span className="text-lg font-bold text-black">R</span>
                </div>
                <div className="text-[9px] text-gray-400 mt-0.5">C&Oacute;D. 91</div>
              </div>

              {/* RIGHT: Remito info */}
              <div className="text-right">
                <div className="text-lg font-bold tracking-wider text-black">REMITO</div>
                <div className="text-xs font-semibold text-gray-800 mt-0.5">N&deg; {num}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">Fecha: {dateStr}</div>
              </div>
            </div>

            {/* DIVIDER */}
            <div className="w-full border-t border-gray-200 mt-3 mb-2" />

            {/* CLIENT */}
            <div>
              <div className="text-[10px] font-medium tracking-wider text-gray-400 uppercase">DESTINATARIO / CLIENTE</div>
              <div className="text-sm font-bold text-gray-900 mt-0.5">{c.name}</div>
              <div className="text-[11px] text-gray-600 leading-normal">
                <div>CUIT: {c.cuit}</div>
                <div>{c.address}</div>
              </div>
            </div>
          </div>

          {/* MIDDLE: Table + Total */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1">
              <table className="w-full border-collapse">
                <thead>
                  <tr
                    className="bg-gray-400"
                    style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                  >
                    <th className="text-[10px] font-bold tracking-wider text-white py-1 px-2 text-center w-8">#</th>
                    <th className="text-[10px] font-bold tracking-wider text-white py-1 px-2 text-left">Descripci&oacute;n del Servicio / Prendas</th>
                    <th className="text-[10px] font-bold tracking-wider text-white py-1 px-2 text-right w-16">Cant.</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 1 ? "bg-gray-50" : ""}
                      style={idx % 2 === 1 ? { WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } : undefined}
                    >
                      <td className="text-xs text-gray-800 py-1 px-2 text-center border-b border-gray-100">{idx + 1}</td>
                      <td className="text-xs text-gray-800 py-1 px-2 border-b border-gray-100">{item.description}</td>
                      <td className="text-xs text-gray-800 py-1 px-2 text-right font-semibold border-b border-gray-100">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-xs font-bold text-gray-900 mt-2 text-right">Total de &iacute;tems: {totalQty}</div>
          </div>

          {/* BOTTOM: Observations + Signature + Legal */}
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase mt-4 mb-1">OBSERVACIONES / DETALLES DEL LOTE</div>
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="h-7 border-b border-gray-200" />
            ))}
            <div className="h-12" />
            <div className="w-1/3 mx-auto border-t border-gray-400" />
            <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1 text-center">RECIB&Iacute; CONFORME</div>
            <div className="text-[9px] text-gray-400 tracking-wider text-center mt-2">DOCUMENTO NO V&Aacute;LIDO COMO FACTURA</div>
          </div>

        </div>
      </div>
    </main>
  );
}
