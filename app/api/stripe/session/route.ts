import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { items, notes, userId } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_SITE_URL is not defined" },
        { status: 500 }
      );
    }

    // line_items برای Stripe (نمایش در Checkout)
    const line_items = items.map((item: any) => ({
      price_data: {
        currency: "eur",
        product_data: { name: item.name },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: Number(item.quantity),
    }));

    // ✅ این مهمه: برای ساخت order_items در webhook
    // محصول/تعداد/قیمت رو داخل metadata می‌ذاریم تا بعداً دقیقاً product_id داشته باشیم
    const itemsForMeta = items.map((it: any) => ({
      productId: String(it.productId), // UUID محصول در DB
      quantity: Number(it.quantity),
      unit_price: Number(it.price), // یورو
    }));

    const items_json = JSON.stringify(itemsForMeta);

    // Stripe metadata محدودیت حجم داره، اینجا جلوی خرابکاری رو می‌گیریم
    if (items_json.length > 4500) {
      return NextResponse.json(
        { error: "Cart too large to encode in Stripe metadata. Reduce items." },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,

      shipping_address_collection: { allowed_countries: ["ES"] },
      phone_number_collection: { enabled: true },

      metadata: {
        user_id: userId ?? "",
        notes: typeof notes === "string" ? notes.slice(0, 450) : "",
        items_json, // ✅ برای webhook
      },

      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout/cancel?session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe session error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
