import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Faltan IDs" }, { status: 400 });
  }

  const supabase = getSupabaseClient(true);

  const existing = await supabase
    .from("bags")
    .select("qr_id")
    .in("qr_id", ids);

  const existingIds = new Set((existing.data ?? []).map((r) => r.qr_id));
  const newIds = ids.filter((id) => !existingIds.has(id));

  if (newIds.length === 0) {
    return NextResponse.json({
      inserted: 0,
      message: "Todos los códigos ya existen en la base de datos",
    });
  }

  const { error } = await supabase
    .from("bags")
    .insert(newIds.map((id: string) => ({ qr_id: id })));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    inserted: newIds.length,
    skipped: ids.length - newIds.length,
  });
}
