import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;
  const supabase = getSupabaseClient(true);

  const { count } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user_id);

  const totalOrders = count ?? 0;

  const { data: promo } = await supabase
    .from("promotions")
    .select("*")
    .eq("user_id", user_id)
    .maybeSingle();

  const earned = Math.floor(totalOrders / 10);

  return NextResponse.json({
    total_orders: totalOrders,
    free_earned: earned,
    free_used: promo?.free_orders_used ?? 0,
    free_available: earned - (promo?.free_orders_used ?? 0),
    next_free_at: (Math.floor(totalOrders / 10) + 1) * 10,
  });
}
