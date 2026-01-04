import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; // یا SUPABASE_URL
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

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err?.message ?? "Invalid signature"}`, { status: 400 });
  }

  // فقط event نهایی پرداخت
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const supabase = getSupabaseAdmin();

    // Stripe identifiers
    const stripeSessionId = session.id;
    const stripePaymentIntentId = (session.payment_intent as string | null) ?? null;

    // user linkage (اختیاری ولی مفید)
    const userId = session.metadata?.user_id ?? null;

    // totals (Stripe بر حسب سنت)
    const totalAmount = (session.amount_total ?? 0) / 100;

    // tax (اگر داری از calcTotals می‌فرستی، بهتره در metadata بفرستی. اینجا fallback داریم)
    const taxRateRaw = session.metadata?.tax_rate ?? null; // مثل "0.1"
    const taxAmountRaw = session.metadata?.tax_amount ?? null; // مثل "1.56"

    const tax_rate =
      taxRateRaw !== null && taxRateRaw !== "" ? Number(taxRateRaw) : null;

    const tax_amount =
      taxAmountRaw !== null && taxAmountRaw !== "" ? Number(taxAmountRaw) : null;

    const notes = session.metadata?.notes ?? null;

    // shipping_address: اگر Stripe خودش آدرس گرفته باشد
    // shipping_details معمولاً شامل name + address + phone است (ممکنه phone null باشه)
    const shipping_address = (session as any).shipping_details ?? null;


    // (اختیاری) برای ذخیره ایمیل، اگر توی جدول ستونی داری باید اضافه کنی
    // const customerEmail = session.customer_details?.email ?? null;

    const payload: Record<string, any> = {
      user_id: userId,                 // اگر null باشه و ستون NOT NULL باشه، خطا می‌گیری
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

    // اگر user_id در دیتابیس NOT NULL است، بهتره اینجا enforce کنی:
    if (!payload.user_id) {
      return new Response("Missing user_id in session.metadata", { status: 400 });
    }

    // ✅ idempotent: اگر وبهوک چندبار اومد، تکراری نسازه
    const { error } = await supabase
      .from("orders")
      .upsert(payload, { onConflict: "stripe_session_id" });

    if (error) {
      console.error("❌ Failed to upsert order:", error);
      return new Response("Failed to write order", { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
