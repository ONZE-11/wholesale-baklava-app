import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function extractId(req: NextRequest, params?: Record<string, string>) {
  const fromParams =
    params?.id || params?.orderId || params?.order_id || params?.slug;
  if (fromParams) return String(fromParams);

  const { pathname } = new URL(req.url);
  const parts = pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    (v || "").trim()
  );
}

export async function GET(
  req: NextRequest,
  ctx: { params?: Record<string, string> }
) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const authUser = userData.user;

    if (userErr || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = extractId(req, ctx?.params);
    if (!orderId || orderId === "undefined" || !isUuid(orderId)) {
      return NextResponse.json(
        { error: "Invalid order id", got: orderId || null },
        { status: 400 }
      );
    }

    const { data: profile, error: profileErr } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", authUser.id)
      .single();

    if (profileErr || !profile?.id) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, created_at, status, payment_status, total_amount, user_id, payment_method, notes, shipping_address, stripe_session_id, stripe_payment_intent_id"
      )
      .eq("id", orderId)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 400 });
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select(
        "id, product_id, quantity, unit_price, subtotal, products(name_en, name_es)"
      )
      .eq("order_id", orderId);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }

    const normalizedItems = (items || []).map((it: any) => ({
      id: it.id,
      product_id: it.product_id,
      name_en: it.products?.name_en ?? "Unknown product",
      name_es: it.products?.name_es ?? "Producto desconocido",
      quantity: it.quantity,
      unit_price: it.unit_price,
      subtotal: it.subtotal,
    }));

    return NextResponse.json({ order, items: normalizedItems });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
