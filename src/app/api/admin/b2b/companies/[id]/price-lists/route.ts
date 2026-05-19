import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const supabase = getSupabaseClient(true);
  const { id } = await params;

  const { data } = await supabase
    .from("price_lists")
    .select("*")
    .eq("company_id", id)
    .order("item_description");
  return NextResponse.json({ price_list: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const supabase = getSupabaseClient(true);
  const { id } = await params;
  const body = await req.json();

  const { item_description, unit_price } = body;
  if (!item_description || unit_price == null) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("price_lists")
    .insert({ company_id: id, item_description, unit_price })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ price_item: data });
}
