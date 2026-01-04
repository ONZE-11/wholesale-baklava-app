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

    const body = await req.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order items are required" },
        { status: 400 }
      );
    }

    // ✅ ارسال فیزیکی: آدرس باید وجود داشته باشد
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

    // ✅ محاسبه‌ی subtotal/tax/total با cents (دقیق)
    const calcItems = body.items.map((item: any) => ({
      price: Number(item.price),
      quantity: Number(item.quantity),
    }));

    const totals = calcTotalsFromItems(calcItems);
    // totals = { subtotal, tax, total, subtotalCents, taxCents, totalCents }

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: session.user.id,
          payment_method: body.paymentMethod,
          notes: body.notes || null,
          shipping_address: body.shippingAddress,

          // 👇 این‌ها رو ذخیره کن
          tax_rate: IVA_RATE,        // 0.10  (پیشنهاد من)
          tax_amount: totals.tax,    // مبلغ مالیات
          total_amount: totals.total, // مبلغ نهایی (subtotal + tax)

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
      subtotal: Number(item.price) * Number(item.quantity), // بدون IVA، درست همینه
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert);

    if (itemsError) {
      // ✅ جلوگیری از سفارش ناقص
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
        taxRate: IVA_RATE, // یا IVA_PERCENT اگر درصدی نمایش می‌دی
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
