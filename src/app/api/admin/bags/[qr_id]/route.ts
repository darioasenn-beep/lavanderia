import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ qr_id: string }> }
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseClient(true);
  const { qr_id } = await params;

  const { data, error } = await supabase
    .from("bags")
    .update({ user_id: null, status: "Available" })
    .eq("qr_id", qr_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath(`/q/${qr_id}`);
  revalidatePath(`/api/qr/${qr_id}`);

  return NextResponse.json(
    { bag: data },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
