import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ✅ Admin Supabase client (bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  console.log("✅ STRIPE WEBHOOK HIT");

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    console.error("❌ Missing stripe-signature header");
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await req.text();
  console.log("✅ signature exists?", true);
  console.log("✅ body length:", body.length);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed:", err?.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // ✅ فقط رویداد مورد نیاز
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const orderId = session.metadata?.orderId;
    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : null;

    console.log("✅ checkout.session.completed", {
      orderId,
      paymentIntentId,
    });

    if (!orderId) {
      console.error("❌ Missing orderId in session.metadata");
      return new Response("Missing orderId", { status: 400 });
    }

    // 🔥 آپدیت سفارش با Service Role (بدون گیر کردن در RLS)
    const { error } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        status: "processing", // اختیاری: اگر نمی‌خوای تغییر کنه، این خط رو بردار
        // اگر ستون payment_intent_id داری اینو نگه دار، اگر نداری حذف کن:
       
      })
      .eq("id", orderId);

    if (error) {
      console.error("❌ Failed to update order:", error);
      return new Response("Failed to update order", { status: 500 });
    }

    console.log(`✅ Order ${orderId} marked as paid`);
  }

  return NextResponse.json({ received: true });
}
