"use client";

import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutFormProps {
  cartItems: CartItem[];
  shippingAddress: string;
  userId?: string;
}

export function CheckoutForm({ cartItems, shippingAddress, userId }: CheckoutFormProps) {
  const [loading, setLoading] = useState(false);

  async function handlePlaceOrder(paymentMethod: "cash" | "online") {
    if (!cartItems || cartItems.length === 0) return;

    setLoading(true);
    try {
      // ایجاد سفارش در سرور
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems,
          shippingAddress,
          paymentMethod,
          totalAmount: cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order creation failed");

      // پرداخت آنلاین با Stripe
      if (paymentMethod === "online") {
        const stripeRes = await fetch("/api/stripe/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: cartItems, orderId: data.orderId, shippingAddress }),
        });

        const stripeData = await stripeRes.json();
        if (!stripeRes.ok || !stripeData.url) throw new Error(stripeData.error || "Stripe session failed");

        window.location.href = stripeData.url;
      } else {
        toast({ title: "Order placed", description: "Pay on delivery" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Checkout failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <button disabled={loading} onClick={() => handlePlaceOrder("cash")}>
        Pay Cash
      </button>
      <button disabled={loading} onClick={() => handlePlaceOrder("online")}>
        Pay Online
      </button>
    </div>
  );
}
