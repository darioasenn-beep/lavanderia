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
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";

  if (q) {
    const { data: bags } = await supabase
      .from("bags")
      .select("*, users(id, room_number, last_name)")
      .or(`qr_id.ilike.%${q}%,users.room_number.ilike.%${q}%`)
      .limit(10);

    return NextResponse.json({ bags: bags ?? [] });
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("*, users(room_number, last_name), corporate_details(name, cuit)")
    .eq("profile_type", "WALK_IN")
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ orders: orders ?? [] });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseClient(true);
  const body = await req.json();
  const { action } = body;

  if (action === "quick-sale") {
    const { name, phone, item_count, service_type, payment_method } = body;
    if (!name || !item_count) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const { data: user } = await supabase
      .from("users")
      .insert({ room_number: `WALK-${Date.now()}`, last_name: name, is_active: true })
      .select("id")
      .single();

    if (!user) return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });

    await supabase.from("client_profiles").insert({
      user_id: user.id,
      profile_type: "WALK_IN",
      name,
      phone: phone ?? null,
    });

    const bag = await supabase
      .from("bags")
      .select("qr_id")
      .eq("status", "Available")
      .limit(1)
      .maybeSingle();

    const qrId = bag?.data?.qr_id ?? `WALK-${Date.now()}`;
    if (bag?.data) {
      await supabase
        .from("bags")
        .update({ user_id: user.id, status: "Assigned" })
        .eq("qr_id", qrId);
    }

    const { data: order } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        qr_id: qrId,
        item_count,
        service_type: service_type ?? "Regular",
        profile_type: "WALK_IN",
        payment_status: payment_method === "Cash" ? "Paid" : "Pending",
        payment_method: payment_method ?? "Cash",
      })
      .select()
      .single();

    return NextResponse.json({ order });
  }

  if (action === "link-bag") {
    const { qr_id, user_id } = body;
    if (!qr_id || !user_id) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("bags")
      .update({ user_id, status: "Assigned" })
      .eq("qr_id", qr_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ bag: data });
  }

  if (action === "promotion-check") {
    const { user_id } = body;
    if (!user_id) {
      return NextResponse.json({ error: "Falta user_id" }, { status: 400 });
    }

    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id)
      .eq("status", "Delivered");

    const totalOrders = count ?? 0;
    const earnedFree = Math.floor(totalOrders / 10);
    const usedFree = 0;

    const { data: promo } = await supabase
      .from("promotions")
      .upsert(
        {
          user_id,
          total_orders: totalOrders,
          free_orders_earned: earnedFree,
          free_orders_used: usedFree,
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    return NextResponse.json({
      promotion: promo,
      hasFree: earnedFree > usedFree,
      nextFreeAt: (Math.floor(totalOrders / 10) + 1) * 10,
    });
  }

  return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
}
