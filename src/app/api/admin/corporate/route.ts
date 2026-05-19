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
    .from("corporate_details")
    .select("*")
    .order("name");
  return NextResponse.json({ companies: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const supabase = getSupabaseClient(true);
  const body = await req.json();

  if (body.action === "create-order") {
    const { corporate_id, items, service_type } = body;
    if (!corporate_id || !items?.length) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const corp = await supabase
      .from("corporate_details")
      .select("id, name, cuit")
      .eq("id", corporate_id)
      .single();

    if (!corp.data) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    }

    const results = [];
    for (const item of items) {
      const user = await supabase
        .from("users")
        .insert({
          room_number: `CORP-${corporate_id.slice(0, 8)}`,
          last_name: corp.data.name,
          is_active: true,
        })
        .select("id")
        .single();

      if (!user.data) continue;

      await supabase.from("client_profiles").insert({
        user_id: user.data.id,
        profile_type: "CORPORATE",
        corporate_id: corporate_id,
        name: item.employee_name ?? null,
      });

      const bag = await supabase
        .from("bags")
        .select("qr_id, status")
        .eq("status", "Available")
        .limit(1)
        .maybeSingle();

      const qrId = bag.data?.qr_id ?? `BATCH-${Date.now()}`;

      if (bag.data) {
        await supabase
          .from("bags")
          .update({ user_id: user.data.id, status: "Assigned" })
          .eq("qr_id", qrId);
      }

      const { data: order } = await supabase
        .from("orders")
        .insert({
          user_id: user.data.id,
          qr_id: qrId,
          item_count: item.count,
          service_type: service_type ?? "Regular",
          profile_type: "CORPORATE",
          corporate_id,
        })
        .select()
        .single();

      if (order) results.push(order);
    }

    return NextResponse.json({ orders: results, count: results.length });
  }

  const { name, cuit, business_name, address } = body;
  if (!name || !cuit || !business_name) {
    return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("corporate_details")
    .insert({ name, cuit, business_name, address })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ company: data });
}
