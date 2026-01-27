import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

function createSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // ✅ برای verify user باید ANON استفاده کنی، نه service role
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const paymentIntentId = body?.paymentIntentId;
    const orderId = body?.orderId;

    if (!paymentIntentId || !orderId) {
      return NextResponse.json(
        { error: "Payment intent ID and order ID are required" },
        { status: 400 }
      );
    }

    // ✅ Auth: از Bearer token (اگر فرانت می‌فرسته)
    // اگر نمی‌فرستی، این بخش را موقتاً حذف کن ولی بهتره حتماً داشته باشی.
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = createSupabase();
    const { data, error: authError } = await supabase.auth.getUser(token);

    const authUser = data?.user;
    if (authError || !authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ✅ (پیشنهادی) سفارش باید متعلق به همین user باشد
    // اگر db.orders.getById داری، فعالش کن:
    // const order = await db.orders.getById(orderId);
    // if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    // if (order.user_id !== authUser.id) {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      // ✅ فقط 2 آرگومان (مطابق تایپ فعلی db)
      await db.orders.updatePaymentStatus(orderId, "paid");

      return NextResponse.json({
        success: true,
        message: "Payment confirmed successfully",
      });
    }

    return NextResponse.json({
      success: false,
      message: "Payment not completed",
      status: paymentIntent.status,
    });
  } catch (error: any) {
    console.error("[confirm payment] error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
