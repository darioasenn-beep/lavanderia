import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseClient(true);

  const { data: orders } = await supabase
    .from("orders")
    .select("*, users(room_number, last_name)")
    .order("created_at", { ascending: false });

  const { data: bags } = await supabase
    .from("bags")
    .select("*, users(room_number, last_name)")
    .order("created_at", { ascending: false });

  const userIds = [...new Set((orders ?? []).map((o) => o.user_id).filter(Boolean))];

  const { data: profiles } = await supabase
    .from("client_profiles")
    .select("user_id, phone")
    .in("user_id", userIds);

  const phoneByUserId = Object.fromEntries(
    (profiles ?? []).map((p) => [p.user_id, p.phone])
  );

  const ordersWithPhone = (orders ?? []).map((o) => ({
    ...o,
    client_profiles: o.user_id && phoneByUserId[o.user_id]
      ? { phone: phoneByUserId[o.user_id] }
      : null,
  }));

  return NextResponse.json(
    { orders: ordersWithPhone, bags: bags ?? [] },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseClient(true);
  const body = await req.json();

  if (body.action === "liberar") {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { qrId } = body;
    if (!qrId) {
      return NextResponse.json(
        { error: "Falta qrId" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("bags")
      .update({ user_id: null, status: "Available" })
      .eq("qr_id", qrId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath(`/q/${qrId}`);
    revalidatePath(`/api/qr/${qrId}`);

    return NextResponse.json(
      { bag: data },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }

  const { qr_id, item_count, service_type } = body;

  if (!qr_id || !item_count) {
    return NextResponse.json(
      { error: "Faltan datos requeridos" },
      { status: 400 }
    );
  }

  const bag = await supabase
    .from("bags")
    .select("user_id")
    .eq("qr_id", qr_id)
    .single();

  if (!bag.data?.user_id) {
    return NextResponse.json(
      { error: "QR no asignado a un usuario. Liberá la bolsa y vinculá la habitación de nuevo." },
      { status: 400 }
    );
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: bag.data.user_id,
      qr_id,
      item_count,
      service_type: service_type ?? "Regular",
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json(
      { error: `Error al crear orden: ${orderError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { order },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
