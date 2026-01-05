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
  console.log("✅ STRIPE WEBHOOK HIT");

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

  // فقط برای کاهش نویز
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  const stripeSessionId = session.id;
  const stripePaymentIntentId = (session.payment_intent as string | null) ?? null;
  const orderIdFromMeta = session.metadata?.orderId || null;

  console.log("✅ checkout.session.completed", {
    stripeSessionId,
    stripePaymentIntentId,
    orderIdFromMeta,
  });

  const supabaseAdmin = getSupabaseAdmin();

  // 1) تلاش اصلی: match با stripe_session_id (مطمئن‌ترین)
  let updatedRows: any[] | null = null;

  {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        status: "processing",
        stripe_payment_intent_id: stripePaymentIntentId,
      })
      .eq("stripe_session_id", stripeSessionId)
      .select("id, payment_status, stripe_session_id, stripe_payment_intent_id");

    if (error) {
      console.error("❌ Failed to update by stripe_session_id:", error);
      return new Response("DB update failed", { status: 500 });
    }

    updatedRows = data ?? [];
  }

  // 2) اگر پیدا نشد: fallback با orderId (برای سازگاری با نسخه‌های قبلی)
  if ((!updatedRows || updatedRows.length === 0) && orderIdFromMeta) {
    console.warn("⚠️ No order matched stripe_session_id. Falling back to metadata.orderId:", orderIdFromMeta);

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        status: "processing",
        stripe_session_id: stripeSessionId, // اینجا هم ذخیره کن که بعداً همه چی یکدست شود
        stripe_payment_intent_id: stripePaymentIntentId,
      })
      .eq("id", orderIdFromMeta)
      .select("id, payment_status, stripe_session_id, stripe_payment_intent_id");

    if (error) {
      console.error("❌ Failed to update by orderId:", error);
      return new Response("DB update failed (fallback)", { status: 500 });
    }

    updatedRows = data ?? [];
  }

  // 3) اگر هنوز هیچ ردیفی آپدیت نشد => یعنی واقعاً چیزی پیدا نشده
  if (!updatedRows || updatedRows.length === 0) {
    console.error("❌ No order updated. Not found for session/orderId:", {
      stripeSessionId,
      orderIdFromMeta,
    });
    // 400 که تو Stripe Delivery قرمز بشه و بفهمی مشکل چیه
    return new Response("Order not found for this session", { status: 400 });
  }

  console.log("✅ Order marked as paid:", updatedRows[0]);

  return NextResponse.json({ received: true });
}
