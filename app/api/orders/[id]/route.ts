import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 401 });
    }

    const session = sessionData.session;
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = params.id;
    if (!orderId || orderId === "undefined") {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    // سفارش فقط برای مالک همان سفارش
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, created_at, status, payment_status, total_amount, user_id, payment_method, notes, shipping_address"
      )
      .eq("id", orderId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 400 });
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("id, product_id, quantity, unit_price, subtotal, products(name_en, name_es)")
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
