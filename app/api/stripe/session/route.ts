import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calcTotalsFromItems, IVA_PERCENT } from "@/lib/tax";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

function toCents(amount: number) {
  return Math.round(amount * 100);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, orderId } = body as {
      items: Array<{ productId: string; quantity: number }>;
      orderId: string;
    };

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // ✅ قیمت‌ها از DB (امنیت)
    const supabase = createSupabaseServerClient();

    const productIds = items.map((x) => x.productId);

    const { data: products, error } = await supabase
      .from("products")
      .select("id, price")
      .in("id", productIds);

    if (error || !products) {
      return NextResponse.json(
        { error: "Failed to load products" },
        { status: 500 }
      );
    }

    const priceMap = new Map<string, number>();
    for (const p of products) priceMap.set(String(p.id), Number(p.price));

    // ✅ subtotal/tax/total از DB-price
    const normalized = items.map((it) => {
      const price = priceMap.get(String(it.productId));
      if (!price) throw new Error(`Product not found: ${it.productId}`);
      return { price, quantity: Number(it.quantity) };
    });

    const totals = calcTotalsFromItems(normalized);
    const subtotalCents = toCents(totals.subtotal);
    const taxCents = toCents(totals.tax);

    if (subtotalCents <= 0 || subtotalCents > 99999999) {
      return NextResponse.json({ error: "Invalid subtotal" }, { status: 400 });
    }
    if (taxCents < 0 || taxCents > 99999999) {
      return NextResponse.json({ error: "Invalid tax" }, { status: 400 });
    }

    // ✅ سشن Stripe: پرداخت = subtotal + IVA
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "eur",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: "Order subtotal" },
            unit_amount: subtotalCents,
          },
          quantity: 1,
        },
        ...(taxCents > 0
          ? [
              {
                price_data: {
                  currency: "eur",
                  product_data: { name: `IVA (${IVA_PERCENT}%)` },
                  unit_amount: taxCents,
                },
                quantity: 1,
              },
            ]
          : []),
      ],
      metadata: {
        orderId,
        subtotal: totals.subtotal.toFixed(2),
        tax: totals.tax.toFixed(2),
        total: totals.total.toFixed(2),
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/cancel?orderId=${orderId}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Stripe session failed" },
      { status: 500 }
    );
  }
}
