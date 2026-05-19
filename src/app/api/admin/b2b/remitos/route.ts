import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const supabase = getSupabaseClient(true);

  const { data } = await supabase
    .from("corporate_remitos")
    .select("*, companies(name)")
    .order("remito_number", { ascending: false });

  return NextResponse.json({ remitos: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const supabase = getSupabaseClient(true);
  const body = await req.json();

  const { company_id, items } = body;
  if (!company_id || !items?.length) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const total_amount = items.reduce(
    (sum: number, item: { quantity: number; subtotal: number }) =>
      sum + (item.subtotal ?? item.quantity * 0),
    0
  );

  const { data, error } = await supabase
    .from("corporate_remitos")
    .insert({ company_id, items, total_amount })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ remito: data });
}
