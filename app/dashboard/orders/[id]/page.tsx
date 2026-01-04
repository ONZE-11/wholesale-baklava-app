'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/language-context";
import { getAuthUserId } from "@/lib/auth";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

/* =======================
   Types
======================= */

interface Product {
  name_en: string | null;
  name_es: string | null;
}

interface OrderItemRow {
  id: string;
  quantity: any;
  unit_price: any;
  subtotal: any;
  products?: Product | null;
}

interface ShippingAddress {
  full_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
}

interface OrderRow {
  id: string;
  created_at: string;
  status: string;
  payment_method: string;
  payment_status: string;
  total_amount: any;
  tax_amount: any;
  tax_rate: any;
  shipping_address: ShippingAddress | null;
  notes?: string | null;
  order_items: OrderItemRow[];
}

/* =======================
   Helpers
======================= */

function n(v: any): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function moneyEUR(v: any) {
  const x = n(v);
  return `€${x.toFixed(2)}`;
}

function formatDate(d: string) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString();
}

/* =======================
   Component
======================= */

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const { lang } = useLanguage();
  const router = useRouter();

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);

  const translations = {
    en: {
      order: {
        title: "Order",
        back: "Back to Orders",
        items: "Items",
        shipping: "Shipping Address",
        payment: "Payment Method",
        status: {
          delivered: "Delivered",
          shipped: "Shipped",
          processing: "Processing",
          pending: "Pending",
          cancelled: "Cancelled",
        },
        subtotal: "Subtotal",
        tax: "IVA",
        total: "Total",
        payment_status: "Payment",
        notes: "Notes",
      },
      dashboard: { order_date: "Order Date" },
      cart: { quantity: "Quantity" },
      checkout: { stripe: "Stripe", cash: "Cash on Delivery" },
    },
    es: {
      order: {
        title: "Pedido",
        back: "Volver a pedidos",
        items: "Artículos",
        shipping: "Dirección de envío",
        payment: "Método de pago",
        status: {
          delivered: "Entregado",
          shipped: "Enviado",
          processing: "Procesando",
          pending: "Pendiente",
          cancelled: "Cancelado",
        },
        subtotal: "Subtotal",
        tax: "IVA",
        total: "Total",
        payment_status: "Pago",
        notes: "Notas",
      },
      dashboard: { order_date: "Fecha del pedido" },
      cart: { quantity: "Cantidad" },
      checkout: { stripe: "Stripe", cash: "Pago contra reembolso" },
    },
  };

  const t = (key: string) => {
    const keys = key.split(".");
    let res: any = translations[lang as keyof typeof translations] || translations.en;
    for (const k of keys) res = res?.[k];
    return res ?? key;
  };

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);

      const userId = await getAuthUserId();
      if (!userId) {
        router.replace("/login");
        return;
      }

      const supabase = createSupabaseClient();
      const orderId = params.id;

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          created_at,
          status,
          payment_method,
          payment_status,
          total_amount,
          tax_amount,
          tax_rate,
          shipping_address,
          notes,
          order_items (
            id,
            quantity,
            unit_price,
            subtotal,
            products (
              name_en,
              name_es
            )
          )
        `)
        .eq("id", orderId)
        .eq("user_id", userId)
        .single();

      if (error || !data) {
        setOrder(null);
        setLoading(false);
        return;
      }

      setOrder(data as any);
      setLoading(false);
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadOrder();
  }, [params.id, router]);

  const subtotal = useMemo(() => {
    if (!order) return 0;
    return (order.order_items ?? []).reduce((s, it) => s + n(it.subtotal), 0);
  }, [order]);

  const tax = useMemo(() => (order ? n(order.tax_amount ?? 0) : 0), [order]);
  const total = useMemo(() => (order ? n(order.total_amount ?? (subtotal + tax)) : 0), [order, subtotal, tax]);
  const taxRatePct = useMemo(() => {
    const r = order ? n(order.tax_rate ?? 0.10) : 0.10;
    return (r * 100).toFixed(0);
  }, [order]);

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <Badge className="bg-green-500">{t("order.status.delivered")}</Badge>;
      case "shipped":
        return <Badge className="bg-blue-500">{t("order.status.shipped")}</Badge>;
      case "processing":
        return <Badge className="bg-yellow-500">{t("order.status.processing")}</Badge>;
      case "pending":
        return <Badge className="bg-gray-500">{t("order.status.pending")}</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">{t("order.status.cancelled")}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const productName = (p?: Product | null) => {
    if (!p) return "—";
    return lang === "es" ? (p.name_es ?? p.name_en ?? "—") : (p.name_en ?? p.name_es ?? "—");
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!order) return <div className="p-8">Not found</div>;

  const addr = order.shipping_address;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-amber-50/20 to-orange-50/30">
      <div className="container mx-auto px-4 py-12">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("order.back")}
        </Button>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("order.title")} #{order.id.slice(0, 8)}
            </h1>
            {getOrderStatusBadge(order.status)}
          </div>
          <p className="text-muted-foreground">
            {t("dashboard.order_date")}: {formatDate(order.created_at)}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Items */}
          <Card className="lg:col-span-2 border-amber-200 shadow-lg">
            <CardHeader>
              <CardTitle>{t("order.items")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(order.order_items ?? []).map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-4 bg-amber-50/50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {productName(item.products)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("cart.quantity")}: {n(item.quantity)} × {moneyEUR(item.unit_price)}
                      </p>
                    </div>
                    <p className="font-bold text-amber-700">{moneyEUR(item.subtotal)}</p>
                  </div>
                ))}

                {/* Breakdown */}
                <div className="border-t pt-4 mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t("order.subtotal")}:</span>
                    <span className="font-semibold">{moneyEUR(subtotal)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>{t("order.tax")} ({taxRatePct}%):</span>
                    <span className="font-semibold">{moneyEUR(tax)}</span>
                  </div>

                  <div className="flex justify-between text-lg font-bold pt-2">
                    <span>{t("order.total")}:</span>
                    <span className="text-amber-700">{moneyEUR(total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right side */}
          <div className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle>{t("order.shipping")}</CardTitle>
              </CardHeader>
              <CardContent>
                {!addr ? (
                  <p className="text-sm text-muted-foreground">—</p>
                ) : (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div><b className="text-foreground">{addr.full_name}</b></div>
                    <div>{addr.phone}</div>
                    <div>{addr.address}</div>
                    <div>{addr.city}</div>
                    <div>{addr.postal_code}</div>
                    <div>{addr.country}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle>{t("order.payment")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">
                  {order.payment_method === "stripe" ? t("checkout.stripe") : t("checkout.cash")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("order.payment_status")}: <b className="text-foreground">{order.payment_status}</b>
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("order.notes")}: {order.notes || "—"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
