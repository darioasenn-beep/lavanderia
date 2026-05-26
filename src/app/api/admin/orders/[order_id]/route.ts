import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { sendReadyNotification } from "@/lib/whatsapp";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseClient(true);
  const { order_id } = await params;
  const { status } = await req.json();

  const validStatuses = ["Pending", "Processing", "Ready", "Delivered"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("order_id", order_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let whatsappSent = false;

  if (status === "Ready" && data) {
    const { data: profile } = await supabase
      .from("client_profiles")
      .select("phone")
      .eq("user_id", data.user_id)
      .maybeSingle();

    if (profile?.phone) {
      const { data: user } = await supabase
        .from("users")
        .select("room_number")
        .eq("id", data.user_id)
        .single();

      await sendReadyNotification(
        profile.phone,
        user?.room_number ?? "",
        data.item_count
      ).catch((err) => console.error("WhatsApp error:", err));

      whatsappSent = true;
    }
  }

  return NextResponse.json({ order: data, whatsappSent });
}
