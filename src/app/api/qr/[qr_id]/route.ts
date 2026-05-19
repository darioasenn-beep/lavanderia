import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ qr_id: string }> }
) {
  const supabase = getSupabaseClient(true);
  const { qr_id } = await params;

  const { data: bag, error } = await supabase
    .from("bags")
    .select("*, users(id, room_number, last_name, is_active)")
    .eq("qr_id", qr_id)
    .single();

  if (error || !bag) {
    return NextResponse.json({ error: "QR no encontrado" }, { status: 404 });
  }

  let latestOrder = null;
  if (bag.user_id) {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("qr_id", qr_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    latestOrder = data;
  }

  return NextResponse.json(
    { bag, latestOrder },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ qr_id: string }> }
) {
  const supabase = getSupabaseClient(true);
  const { qr_id } = await params;
  const { room_number, last_name } = await req.json();

  if (!room_number || !last_name) {
    return NextResponse.json(
      { error: "Faltan datos requeridos" },
      { status: 400 }
    );
  }

  const existingUser = await supabase
    .from("users")
    .select("id")
    .eq("room_number", room_number)
    .eq("last_name", last_name)
    .single();

  let userId = existingUser.data?.id ?? null;

  if (!userId) {
    const { data: newUser } = await supabase
      .from("users")
      .insert({ room_number, last_name })
      .select("id")
      .single();
    userId = newUser?.id ?? null;
  }

  if (userId) {
    await supabase
      .from("bags")
      .update({ user_id: userId, status: "Assigned" })
      .eq("qr_id", qr_id);
  }

  return NextResponse.json({ user: { id: userId }, qr_id });
}
