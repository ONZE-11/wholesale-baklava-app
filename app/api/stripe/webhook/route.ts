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

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ Webhook signature error:", err?.message);
    return new Response(`Webhook Error: ${err?.message ?? "Invalid signature"}`, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  // ✅ helper برای update با session id
  async function updateBySessionId(
    stripeSessionId: string,
    patch: Record<string, any>
  ) {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .update(patch)
      .eq("stripe_session_id", stripeSessionId)
      .select("id, payment_status, status, stripe_session_id, stripe_payment_intent_id");

    if (error) throw error;
    return data ?? [];
  }

  try {
    // ✅ 1) پرداخت موفق
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const stripeSessionId = session.id;
      const stripePaymentIntentId = (session.payment_intent as string | null) ?? null;

      const updated = await updateBySessionId(stripeSessionId, {
        payment_status: "paid",
        status: "processing",
        stripe_payment_intent_id: stripePaymentIntentId,
      });

      if (!updated.length) {
        console.error("❌ No order found for stripe_session_id:", stripeSessionId);
        return new Response("Order not found for this session", { status: 400 });
      }

      return NextResponse.json({ received: true });
    }

    // ✅ 2) کاربر Cancel کرد یا Session منقضی شد
    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const stripeSessionId = session.id;

      // فقط اگر هنوز unpaid است کنسل کن (اگر paid شده باشد دست نزن)
      await updateBySessionId(stripeSessionId, {
        payment_status: "cancelled",
        status: "cancelled",
      });

      return NextResponse.json({ received: true });
    }

    // (اختیاری) اگر در آینده async payment داشتی
    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const stripeSessionId = session.id;

      await updateBySessionId(stripeSessionId, {
        payment_status: "failed",
        status: "payment_failed",
      });

      return NextResponse.json({ received: true });
    }

    // سایر eventها مهم نیستند
    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error("❌ Webhook handler error:", e?.message || e);
    return new Response("Webhook handler failed", { status: 500 });
  }
}
