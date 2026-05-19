import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { order_id } = await req.json();
  if (!order_id) {
    return NextResponse.json({ error: "Falta order_id" }, { status: 400 });
  }

  const supabase = getSupabaseClient(true);

  const { data: order } = await supabase
    .from("orders")
    .select("*, users(room_number, last_name)")
    .eq("order_id", order_id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  if (order.status !== "Ready") {
    return NextResponse.json(
      { error: "La orden debe estar lista para retirar" },
      { status: 400 }
    );
  }

  const mpAccessToken = process.env.MP_ACCESS_TOKEN;

  if (!mpAccessToken) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lavanderia.com.ar";
    return NextResponse.json({
      sandbox: true,
      init_point: `${baseUrl}/api/payments/simulate?order_id=${order_id}`,
      preference_id: `sandbox_${order_id}`,
    });
  }

  try {
    const preference = {
      items: [
        {
          id: order.order_id,
          title: `Lavandería - ${order.service_type} (${order.item_count} prendas)`,
          quantity: 1,
          unit_price: order.item_count * 1500,
          currency_id: "ARS",
        },
      ],
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://lavanderia.com.ar"}/q/${order.qr_id}`,
        failure: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://lavanderia.com.ar"}/q/${order.qr_id}`,
        pending: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://lavanderia.com.ar"}/q/${order.qr_id}`,
      },
      auto_return: "approved",
      notification_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://lavanderia.com.ar"}/api/payments/webhook`,
    };

    const mpRes = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preference),
      }
    );

    const mpData = await mpRes.json();

    if (mpData.id) {
      await supabase
        .from("orders")
        .update({ mp_preference_id: mpData.id })
        .eq("order_id", order_id);
    }

    return NextResponse.json({
      sandbox: false,
      init_point: mpData.init_point,
      preference_id: mpData.id,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al crear preferencia de pago" },
      { status: 500 }
    );
  }
}
