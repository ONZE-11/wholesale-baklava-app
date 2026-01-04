import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function getSupabaseAdmin() {
  // بهتره از SUPABASE_URL استفاده کنی، ولی اگر فقط NEXT_PUBLIC... داری هم کار می‌کنه
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature header", { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err?.message ?? "Invalid signature"}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const supabaseAdmin = getSupabaseAdmin();

    // کلیدهای مهم از Stripe
    const stripeSessionId = session.id;
    const paymentIntent = (session.payment_intent as string | null) ?? null;
    const amountTotal = session.amount_total ?? 0;
    const currency = session.currency ?? "eur";
    const customerEmail = session.customer_details?.email ?? null;

    // اگر user_id یا cart_id داری، از metadata بخون (اختیاری)
    const userId = session.metadata?.user_id ?? null;

    // فقط همینجا سفارش را بساز (یا آپدیت کن اگر دوباره وبهوک آمد)
    const { error } = await supabaseAdmin
      .from("orders")
      .upsert(
        {
          stripe_session_id: stripeSessionId,
          stripe_payment_intent_id: paymentIntent,
          payment_status: "paid",
          status: "processing",
          amount_total: amountTotal,
          currency,
          customer_email: customerEmail,
          user_id: userId,
          paid_at: new Date().toISOString(),
        },
        { onConflict: "stripe_session_id" }
      );

    if (error) {
      console.error("❌ Failed to upsert order:", error);
      return new Response("Failed to write order", { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
