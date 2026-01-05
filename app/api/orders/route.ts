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

    const calcItems = body.items.map((item: any) => ({
      price: Number(item.price),
      quantity: Number(item.quantity),
    }));

    const totals = calcTotalsFromItems(calcItems);

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

    const itemsToInsert = body.items.map((item: any) => ({
      order_id: orderId,
      product_id: item.productId,
      quantity: Number(item.quantity),
      unit_price: Number(item.price),
      subtotal: Number(item.price) * Number(item.quantity),
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
