import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  
});

export async function POST(req: Request) {
  try {
    const { items, orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const line_items = items.map((item: any) => ({
      price_data: {
        currency: "eur",
        product_data: { name: item.name },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: Number(item.quantity),
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?orderId=${orderId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/cancel`,
      metadata: { orderId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe session error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
