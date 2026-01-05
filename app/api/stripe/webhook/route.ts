import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature header", { status: 400 });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });

  // ✅ Raw body برای verify امضا
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ Webhook signature error:", err?.message);
    return new Response(`Webhook Error: ${err?.message ?? "Invalid signature"}`, { status: 400 });
  }

  // فقط این رویداد برای ساخت/آپدیت سفارش کافی است
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  const supabase = getSupabaseAdmin();

  // Stripe identifiers
  const stripeSessionId = session.id;
  const stripePaymentIntentId = (session.payment_intent as string | null) ?? null;

  // user linkage
  const userId = session.metadata?.user_id ?? null;

  if (!userId) {
    return new Response("Missing user_id in session.metadata", { status: 400 });
  }

  // totals (cents -> eur)
  const totalAmount = (session.amount_total ?? 0) / 100;

  const notes = session.metadata?.notes ?? null;

  // shipping (اگر Stripe جمع کرده)
  const shipping_address = (session as any).shipping_details ?? null;

  // (اختیاری) tax از metadata
  const taxRateRaw = session.metadata?.tax_rate ?? null;
  const taxAmountRaw = session.metadata?.tax_amount ?? null;

  const tax_rate = taxRateRaw ? Number(taxRateRaw) : null;
  const tax_amount = taxAmountRaw ? Number(taxAmountRaw) : null;

  try {
    // 1) upsert orders و id رو هم بگیر
    const payload: Record<string, any> = {
      user_id: userId,
      total_amount: totalAmount,
      payment_method: "stripe",
      payment_status: "paid",
      status: "processing",
      notes,
      shipping_address,
      tax_rate,
      tax_amount,
      stripe_session_id: stripeSessionId,
      stripe_payment_intent_id: stripePaymentIntentId,
    };

    const { data: savedOrder, error: upsertErr } = await supabase
      .from("orders")
      .upsert(payload, { onConflict: "stripe_session_id" })
      .select("id")
      .single();

    if (upsertErr || !savedOrder?.id) {
      console.error("❌ Failed to upsert order:", upsertErr);
      return new Response("Failed to write order", { status: 500 });
    }

    const order_id = savedOrder.id as string;

    // 2) ساخت order_items از metadata.items_json
    const itemsJson = session.metadata?.items_json;
    if (!itemsJson) {
      console.warn("⚠️ items_json missing in session.metadata. order_items will NOT be created.");
      // سفارش ثبت شده، آیتم نه. برای اینکه پرداخت fail نشه، 200 می‌دیم.
      return NextResponse.json({ received: true, warning: "items_json missing" });
    }

    let items: Array<{ productId: string; quantity: number; unit_price: number }> = [];
    try {
      items = JSON.parse(itemsJson);
    } catch {
      return new Response("Invalid items_json in metadata", { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return new Response("items_json is empty", { status: 400 });
    }

    // idempotent: اگر وبهوک دوباره اومد، تکراری نسازه
    const { error: delErr } = await supabase.from("order_items").delete().eq("order_id", order_id);
    if (delErr) {
      console.error("❌ Failed to clear order_items:", delErr);
      return new Response("Failed to clear order items", { status: 500 });
    }

    const rows = items.map((it) => ({
      order_id,
      product_id: String(it.productId),
      quantity: Number(it.quantity),
      unit_price: Number(it.unit_price),
      subtotal: Number(it.unit_price) * Number(it.quantity),
    }));

    const { error: insErr } = await supabase.from("order_items").insert(rows);
    if (insErr) {
      console.error("❌ Failed to insert order_items:", insErr);
      return new Response("Failed to insert order items", { status: 500 });
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error("❌ Webhook handler error:", e?.message || e);
    return new Response(e?.message || "Webhook handler failed", { status: 500 });
  }
}
