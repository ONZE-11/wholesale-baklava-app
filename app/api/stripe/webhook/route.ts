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
  console.log("✅ WEBHOOK HIT");

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature header", { status: 400 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: any) {
    console.error("❌ Signature verification failed:", err?.message);
    return new Response("Invalid signature", { status: 400 });
  }

  console.log("✅ Event type:", event.type);

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  const stripeSessionId = session.id;
  const stripePaymentIntentId = (session.payment_intent as string | null) ?? null;

  console.log("✅ Session:", stripeSessionId, "PI:", stripePaymentIntentId);

  const supabaseAdmin = getSupabaseAdmin();

  const { data: updated, error } = await supabaseAdmin
    .from("orders")
    .update({
      payment_status: "paid",
      status: "processing",
      stripe_payment_intent_id: stripePaymentIntentId,
    })
    .eq("stripe_session_id", stripeSessionId)
    .select("id, payment_status, stripe_session_id, stripe_payment_intent_id");

  if (error) {
    console.error("❌ DB update failed:", error);
    return new Response("DB update failed", { status: 500 });
  }

  if (!updated || updated.length === 0) {
    console.error("❌ No order matched stripe_session_id:", stripeSessionId);
    return new Response("Order not found for session", { status: 400 });
  }

  console.log("✅ Updated order:", updated[0]);

  return NextResponse.json({ received: true });
}
