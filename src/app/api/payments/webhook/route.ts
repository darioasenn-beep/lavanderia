import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (type !== "payment" || !data?.id) {
      return NextResponse.json({ received: true });
    }

    const mpAccessToken = process.env.MP_ACCESS_TOKEN;

    if (mpAccessToken) {
      const mpRes = await fetch(
        `https://api.mercadopago.com/v1/payments/${data.id}`,
        { headers: { Authorization: `Bearer ${mpAccessToken}` } }
      );
      const payment = await mpRes.json();

      if (payment.status === "approved") {
        const supabase = getSupabaseClient(true);

        const { data: order } = await supabase
          .from("orders")
          .select("*")
          .eq("mp_preference_id", payment.preference_id)
          .single();

        if (order) {
          await supabase
            .from("orders")
            .update({
              payment_status: "Paid",
              payment_method: "MercadoPago",
              paid_at: new Date().toISOString(),
            })
            .eq("order_id", order.order_id);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const order_id = searchParams.get("order_id");

  if (status === "approved" && order_id) {
    const supabase = getSupabaseClient(true);
    await supabase
      .from("orders")
      .update({
        payment_status: "Paid",
        payment_method: "MercadoPago",
        paid_at: new Date().toISOString(),
      })
      .eq("order_id", order_id);
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://lavanderia.com.ar"}/q/${order_id ?? ""}`
  );
}
