"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/i18n";

type Order = {
  id: string;
  payment_status: string | null;
  status: string | null;
};

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const { clearCart } = useCart();
  const { lang } = useLanguage();

  const orderId = useMemo(() => sp.get("orderId"), [sp]);

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const clearedRef = useRef(false);

  useEffect(() => {
    if (!orderId) {
      setErr("Missing orderId");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function sleep(ms: number) {
      return new Promise((r) => setTimeout(r, ms));
    }

    async function loadWithRetry() {
      setLoading(true);
      setErr(null);

      // ✅ 10 بار تلاش، هر بار 1.2 ثانیه
      for (let i = 0; i < 10; i++) {
        try {
          const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
          const json = await res.json();

          if (!res.ok) throw new Error(json?.error || "Failed to load order");

          const o: Order = json.order;
          if (!cancelled) setOrder(o);

          // ✅ اگر paid شد: cart پاک شود
          if (o?.payment_status === "paid") {
            if (!clearedRef.current) {
              clearCart();
              clearedRef.current = true;
            }
            if (!cancelled) {
              setLoading(false);
              return;
            }
          }

          // ✅ اگر cancelled/failed شد: توقف
          if (o?.payment_status === "cancelled" || o?.payment_status === "failed") {
            if (!cancelled) {
              setLoading(false);
              return;
            }
          }

          // هنوز pending/unpaid: کمی صبر کن و دوباره
          await sleep(1200);
        } catch (e: any) {
          // اگر خطا بود هم چندبار retry کنیم
          await sleep(1200);
          if (i === 9 && !cancelled) {
            setErr(e?.message || "Unknown error");
            setLoading(false);
          }
        }
      }

      if (!cancelled) setLoading(false);
    }

    loadWithRetry();

    return () => {
      cancelled = true;
    };
  }, [orderId, clearCart]);

  const goOrders = () => router.push("/orders");
  const goCart = () => router.push("/cart");
  const goHome = () => router.push("/");

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-sm text-muted-foreground">
          {lang === "es" ? "Confirmando el pago..." : "Confirming payment..."}
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="container mx-auto px-4 py-12 space-y-4">
        <div className="text-sm text-red-600 whitespace-pre-wrap">{err}</div>
        <Button onClick={goHome}>{lang === "es" ? "Inicio" : "Home"}</Button>
      </div>
    );
  }

  if (order?.payment_status === "paid") {
    return (
      <div className="container mx-auto px-4 py-12 space-y-4">
        <h1 className="text-2xl font-bold">
          {lang === "es" ? "Pago completado" : "Payment completed"}
        </h1>
        <p className="text-muted-foreground">
          {lang === "es"
            ? "Tu pedido ha sido confirmado."
            : "Your order has been confirmed."}
        </p>
        <div className="flex gap-3">
          <Button onClick={goOrders}>
            {lang === "es" ? "Ver pedidos" : "View orders"}
          </Button>
          <Button variant="outline" onClick={goHome}>
            {lang === "es" ? "Volver" : "Back"}
          </Button>
        </div>
      </div>
    );
  }

  if (order?.payment_status === "cancelled") {
    return (
      <div className="container mx-auto px-4 py-12 space-y-4">
        <h1 className="text-2xl font-bold">
          {lang === "es" ? "Pago cancelado" : "Payment cancelled"}
        </h1>
        <p className="text-muted-foreground">
          {lang === "es"
            ? "No se realizó ningún cargo. Puedes intentarlo de nuevo."
            : "No charge was made. You can try again."}
        </p>
        <Button onClick={goCart}>{lang === "es" ? "Volver al carrito" : "Back to cart"}</Button>
      </div>
    );
  }

  // unpaid/pending بعد از retry ها
  return (
    <div className="container mx-auto px-4 py-12 space-y-4">
      <h1 className="text-2xl font-bold">
        {lang === "es" ? "Procesando" : "Processing"}
      </h1>
      <p className="text-muted-foreground">
        {lang === "es"
          ? "Tu pago aún se está confirmando. Revisa tus pedidos en unos segundos."
          : "Your payment is still being confirmed. Check your orders in a few seconds."}
      </p>
      <Button onClick={goOrders}>{lang === "es" ? "Ver pedidos" : "View orders"}</Button>
    </div>
  );
}
