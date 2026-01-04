import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import Stripe from "stripe";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // یا ANON KEY بسته به نیاز
  return createSupabaseClient(supabaseUrl, supabaseKey);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { paymentIntentId, orderId } = body;

    if (!paymentIntentId || !orderId) {
      return NextResponse.json(
        { error: "Payment intent ID and order ID are required" },
        { status: 400 }
      );
    }

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      // Update order payment status
      await db.orders.updatePaymentStatus(orderId, "paid", paymentIntentId);

      return NextResponse.json({
        success: true,
        message: "Payment confirmed successfully",
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Payment not completed",
        status: paymentIntent.status,
      });
    }
  } catch (error: any) {
    console.error("[v0] Confirm payment error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
