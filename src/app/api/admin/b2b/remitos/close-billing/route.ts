import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const supabase = getSupabaseClient(true);
  const body = await req.json();

  const { company_id, month, year, billing_entity } = body;
  if (!company_id || !month || !year || !billing_entity) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }
  if (!["ACME", "ESTEVE"].includes(billing_entity)) {
    return NextResponse.json({ error: "Entidad inválida" }, { status: 400 });
  }

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const { data: remitos, error: fetchError } = await supabase
    .from("corporate_remitos")
    .select("*")
    .eq("company_id", company_id)
    .is("billed_at", null)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .order("remito_number");

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!remitos?.length) {
    return NextResponse.json({ error: "No hay remitos pendientes en este período" }, { status: 400 });
  }

  const net_amount = remitos.reduce(
    (sum: number, r: { total_amount: number }) => sum + Number(r.total_amount),
    0
  );
  const remito_ids = remitos.map((r: { id: string }) => r.id);

  const invoice_type = billing_entity === "ACME" ? "A" : "C";
  const iva = billing_entity === "ACME" ? net_amount * 0.21 : 0;
  const total = net_amount + iva;

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("corporate_remitos")
    .update({ billed_at: now, billing_entity })
    .in("id", remito_ids);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    period: { month, year },
    billing_entity,
    invoice_type,
    remitos_count: remitos.length,
    net_amount,
    iva,
    total,
    remito_ids,
  });
}
