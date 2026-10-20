import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calcTotalsFromItems, IVA_PERCENT } from "@/lib/tax";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

function toCents(amount: number) {
  return Math.round(amount * 100);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, orderId } = body as {
      items: Array<{ productId: string; quantity: number }>;
      orderId: string;
    };

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SITE_URL" },
        { status: 500 }
      );
    }

    // ✅ Supabase Server Client (با کوکی کاربر)
    const supabase = await createSupabaseServerClient();

    // ✅ کاربر باید لاگین باشد
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const authUser = userData.user;
    if (userErr || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ پروفایل public.users.id برای یکدستی با orders.user_id
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

    // ✅ امنیت: سفارش باید مال همین کاربر باشد
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, user_id, payment_method, payment_status, status, total_amount, stripe_session_id")
      .eq("id", orderId)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (orderErr) {
      return NextResponse.json({ error: orderErr.message }, { status: 400 });
    }
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ✅ اگر سفارش قبلا paid شده، دوباره session نساز
    if (
      order.payment_method !== "stripe" ||
      order.payment_status !== "unpaid" ||
      !["pending", "pending_payment"].includes(order.status)
    ) {
      return NextResponse.json(
        { error: "Order is not eligible for Stripe checkout" },
        { status: 409 }
      );
    }

    // Reuse the existing Stripe Checkout Session when possible.
    if (order.stripe_session_id) {
      const existingSession = await stripe.checkout.sessions.retrieve(
        order.stripe_session_id
      );

      if (
        existingSession.status === "open" &&
        existingSession.payment_status === "unpaid" &&
        existingSession.url
      ) {
        return NextResponse.json({ url: existingSession.url });
      }

      return NextResponse.json(
        { error: "Existing Stripe session is no longer payable" },
        { status: 409 }
      );
    }
    // Read the actual purchased items from the stored order.
    const adminSupabaseForItems = createSupabaseAdminClient();

    const { data: storedItems, error: storedItemsError } =
      await adminSupabaseForItems
        .from("order_items")
        .select("product_id, quantity, unit_price")
        .eq("order_id", orderId);

    if (storedItemsError || !storedItems || storedItems.length === 0) {
      return NextResponse.json(
        { error: "Stored order items not found" },
        { status: 400 }
      );
    }

    const normalized = storedItems.map((item) => ({
      price: Number(item.unit_price),
      quantity: Number(item.quantity),
    }));

    if (normalized.some((item) =>
      !Number.isFinite(item.price) ||
      item.price <= 0 ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0
    )) {
      return NextResponse.json(
        { error: "Invalid stored order items" },
        { status: 400 }
      );
    }

    const totals = calcTotalsFromItems(normalized);

    const expectedCents = toCents(Number(order.total_amount));
    const calculatedCents = toCents(totals.total);

    if (
      !Number.isSafeInteger(expectedCents) ||
      expectedCents <= 0 ||
      calculatedCents !== expectedCents
    ) {
      return NextResponse.json(
        { error: "Stored order total mismatch" },
        { status: 409 }
      );
    }
    const subtotalCents = toCents(totals.subtotal);
    const taxCents = toCents(totals.tax);

    if (subtotalCents <= 0 || subtotalCents > 99999999) {
      return NextResponse.json({ error: "Invalid subtotal" }, { status: 400 });
    }
    if (taxCents < 0 || taxCents > 99999999) {
      return NextResponse.json({ error: "Invalid tax" }, { status: 400 });
    }

    // ✅ ساخت Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "eur",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: "Order subtotal" },
            unit_amount: subtotalCents,
          },
          quantity: 1,
        },
        ...(taxCents > 0
          ? [
              {
                price_data: {
                  currency: "eur",
                  product_data: { name: `IVA (${IVA_PERCENT}%)` },
                  unit_amount: taxCents,
                },
                quantity: 1,
              },
            ]
          : []),
      ],
      metadata: {
        orderId,
        subtotal: totals.subtotal.toFixed(2),
        tax: totals.tax.toFixed(2),
        total: totals.total.toFixed(2),
      },
      success_url: `${siteUrl}/checkout/success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout/cancel?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
    });

    // ✅ خیلی مهم: ذخیره stripe_session_id روی سفارش
    // (این باعث می‌شود webhook با stripe_session_id راحت match کند)
    const adminSupabase = createSupabaseAdminClient();
    const { error: updErr } = await adminSupabase
      .from("orders")
      .update({
        stripe_session_id: session.id,
        // اختیاری ولی توصیه می‌شود:
        status: "pending_payment",
        payment_status: "unpaid",
      })
      .eq("id", orderId)
      .eq("user_id", profile.id);

    if (updErr) {
      console.error("STRIPE_UPDATE_ERROR:", updErr);
      // اگر اینجا fail شود، پرداخت انجام می‌شود ولی ما لینک match نداریم => دردسر
      return NextResponse.json(
        { error: "Failed to attach stripe session to order" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Stripe session failed" },
      { status: 500 }
    );
  }
}
