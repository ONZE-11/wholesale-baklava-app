import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { items, orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    const line_items = items.map((item: any) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: Number(item.quantity),
    }));

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
    if (!siteUrl) {
      throw new Error("NEXT_PUBLIC_SITE_URL is not defined");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,

      // 👇 خیلی مهم
      metadata: {
        orderId,
      },

      success_url: `${siteUrl}/checkout/success?orderId=${orderId}`,
      cancel_url: `${siteUrl}/checkout/cancel?orderId=${orderId}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("❌ Stripe session error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
