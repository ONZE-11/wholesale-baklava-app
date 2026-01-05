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

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  const stripeSessionId = session.id;
  const stripePaymentIntentId = (session.payment_intent as string | null) ?? null;

  const supabaseAdmin = getSupabaseAdmin();

  // ✅ آپدیت را با stripe_session_id انجام بده (محکم‌ترین لینک)
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
    console.error("❌ Failed to update order by stripe_session_id:", error);
    return new Response("Failed to update order", { status: 500 });
  }

  if (!updated || updated.length === 0) {
    console.error("❌ No order found for stripe_session_id:", stripeSessionId, {
      metadata: session.metadata,
      client_reference_id: session.client_reference_id,
    });
    return new Response("Order not found for stripe_session_id", { status: 400 });
  }

  console.log("✅ Order marked paid:", updated[0]);

  return NextResponse.json({ received: true });
}
