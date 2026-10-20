import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calcTotalsFromItems, IVA_RATE, IVA_PERCENT } from "@/lib/tax";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // ✅ پروفایل public.users را پیدا کن تا user_id سفارش‌ها یکدست باشد
    const { data: profile, error: profileErr } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", session.user.id)
      .single();

    if (profileErr || !profile?.id) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 400 }
      );
    }

    const body = await req.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order items are required" },
        { status: 400 }
      );
    }

    if (!body.shippingAddress || typeof body.shippingAddress !== "object") {
      return NextResponse.json(
        { success: false, error: "Shipping address is required" },
        { status: 400 }
      );
    }

    const a = body.shippingAddress;
    if (!a.full_name || !a.phone || !a.address || !a.city || !a.postal_code || !a.country) {
      return NextResponse.json(
        { success: false, error: "Incomplete shipping address" },
        { status: 400 }
      );
    }

    if (!["cash", "stripe"].includes(body.paymentMethod)) {
      return NextResponse.json(
        { success: false, error: "Invalid payment method" },
        { status: 400 }
      );
    }

    const quantities = new Map<string, number>();

    for (const item of body.items) {
      const productId = String(item.productId || "");
      const quantity = item.quantity;

      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productId) ||
        typeof quantity !== "number" ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 1000
      ) {
        return NextResponse.json(
          { success: false, error: "Invalid product or quantity" },
          { status: 400 }
        );
      }

      const combined = (quantities.get(productId) || 0) + quantity;
      if (!Number.isSafeInteger(combined) || combined > 1000) {
        return NextResponse.json(
          { success: false, error: "Quantity limit exceeded" },
          { status: 400 }
        );
      }

      quantities.set(productId, combined);
    }

    const productIds = Array.from(quantities.keys());

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, price")
      .in("id", productIds);

    if (productsError || !products || products.length !== productIds.length) {
      return NextResponse.json(
        { success: false, error: "One or more products are unavailable" },
        { status: 400 }
      );
    }

    const verifiedItems = products.map((product) => ({
      productId: String(product.id),
      price: Number(product.price),
      quantity: quantities.get(String(product.id))!,
    }));

    if (verifiedItems.some((item) =>
      !Number.isFinite(item.price) ||
      item.price <= 0 ||
      !Number.isSafeInteger(item.quantity)
    )) {
      return NextResponse.json(
        { success: false, error: "Invalid product price or quantity" },
        { status: 400 }
      );
    }

    const totals = calcTotalsFromItems(verifiedItems);

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          // ✅ مهم: user_id یکدست با Stripe (public.users.id)
          user_id: profile.id,

          payment_method: body.paymentMethod,
          notes: body.notes || null,
          shipping_address: body.shippingAddress,

          tax_rate: IVA_RATE,
          tax_amount: totals.tax,
          total_amount: totals.total,

          status: "pending",
          payment_status: "unpaid",
        },
      ])
      .select("id")
      .single();

    if (orderError || !orderData) {
      return NextResponse.json(
        { success: false, error: orderError?.message || "Failed to create order" },
        { status: 400 }
      );
    }

    const orderId = orderData.id;

    const itemsToInsert = verifiedItems.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert);

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", orderId);

      return NextResponse.json(
        { success: false, error: itemsError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      totals: {
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        taxRate: IVA_RATE,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
