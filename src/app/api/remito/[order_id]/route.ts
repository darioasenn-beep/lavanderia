import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  const { order_id } = await params;
  const supabase = getSupabaseClient(true);

  const { data: order } = await supabase
    .from("orders")
    .select("*, users(room_number, last_name), corporate_details(name, cuit, business_name, address)")
    .eq("order_id", order_id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const remitoNumber = `R-${order.order_id.slice(0, 8).toUpperCase()}`;

  const { data: existing } = await supabase
    .from("remitos")
    .select("*")
    .eq("order_id", order_id)
    .maybeSingle();

  if (!existing) {
    await supabase.from("remitos").insert({
      order_id,
      remito_number: remitoNumber,
    });
  }

  const companyName = order.corporate_details?.business_name ?? "Residente";
  const companyCuit = order.corporate_details?.cuit ?? "-";
  const clientName = order.users?.last_name ?? order.corporate_details?.name ?? "Cliente";
  const clientRoom = order.users?.room_number ?? "-";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Remito ${remitoNumber}</title>
  <style>
    @page { margin: 2cm; }
    body { font-family: 'Times New Roman', serif; color: #0F172A; }
    .header { text-align: center; border-bottom: 2px solid #C9A84C; padding-bottom: 1cm; margin-bottom: 1cm; }
    .header h1 { font-size: 24px; margin: 0; color: #1B2A4A; }
    .header p { font-size: 12px; color: #666; margin: 4px 0 0; }
    .info { display: flex; justify-content: space-between; margin-bottom: 1cm; }
    .info div { font-size: 13px; }
    .info strong { color: #1B2A4A; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1cm; }
    th, td { padding: 8px 12px; text-align: left; font-size: 13px; }
    th { background: #1B2A4A; color: white; font-weight: normal; }
    td { border-bottom: 1px solid #e2e8f0; }
    .total { text-align: right; font-size: 16px; font-weight: bold; color: #1B2A4A; margin-bottom: 1cm; }
    .footer { text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 0.5cm; }
    .qr-placeholder { width: 100px; height: 100px; border: 2px dashed #C9A84C; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5cm; font-size: 10px; color: #C9A84C; }
    .validation { text-align: center; margin-bottom: 1cm; }
    .validation p { font-size: 11px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Laundri-Sync — Remito Digital</h1>
    <p>Servicio de Lavandería Boutique</p>
  </div>

  <div class="info">
    <div>
      <strong>Remito N°:</strong> ${remitoNumber}<br>
      <strong>Fecha:</strong> ${new Date(order.created_at).toLocaleDateString("es-AR")}<br>
      <strong>Orden:</strong> ${order.order_id.slice(0, 8)}
    </div>
    <div style="text-align: right;">
      <strong>Cliente:</strong> ${clientName}<br>
      <strong>Habitación/Lote:</strong> ${clientRoom}<br>
      <strong>Empresa:</strong> ${companyName}<br>
      <strong>CUIT:</strong> ${companyCuit}
    </div>
  </div>

  <table>
    <tr>
      <th>Servicio</th>
      <th>Cantidad</th>
      <th>Tipo</th>
      <th>Estado</th>
    </tr>
    <tr>
      <td>Lavandería</td>
      <td>${order.item_count} prendas</td>
      <td>${order.service_type}</td>
      <td>${order.status === "Pending" ? "Pendiente" : order.status === "Processing" ? "En Proceso" : order.status === "Ready" ? "Listo" : "Entregado"}</td>
    </tr>
  </table>

  <div class="total">
    Total: ${order.item_count} prendas
  </div>

  <div class="validation">
    <div class="qr-placeholder">QR</div>
    <p>Código de validación: ${remitoNumber}-${order.order_id.slice(0, 4)}<br>
    Escanea el QR para verificar el estado del pedido</p>
  </div>

  <div class="footer">
    <p>Martínez, Buenos Aires, Argentina — Este documento es un comprobante digital de servicio.</p>
    <p>${order.corporate_details ? "Factura A/B simulada — AFIP WebService" : "Consumidor Final"}</p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
