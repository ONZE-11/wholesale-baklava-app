"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/language-context";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

/* =======================
   Types
======================= */

interface Product {
  id: string;
  name_en: string;
  name_es: string;
}

interface OrderItem {
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_id: string;
  product?: Product | null;
}

interface Order {
  id: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  tax_amount: number | null;
  tax_rate: number | null;
  order_items: OrderItem[];
}

/* =======================
   Component
======================= */

export default function OrdersPage() {
  const supabase = createSupabaseClient();
  const router = useRouter();
  const { lang } = useLanguage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [hasMore, setHasMore] = useState(true);

  const translations = {
    en: {
      your_orders: "Your Orders",
      back_home: "Back to Home",
      no_orders: "No orders found.",
      no_access:
        "You don’t have access to view orders or something went wrong.",
      payment_status: "Payment",
      total: "Total",
      date: "Date",
      products: "Products",
      search_placeholder: "Search product...",
      from_date: "From",
      to_date: "To",
      load_more: "Load More",
    },
    es: {
      your_orders: "Tus pedidos",
      back_home: "Volver a inicio",
      no_orders: "No se encontraron pedidos.",
      no_access: "No tienes acceso para ver los pedidos o algo salió mal.",
      payment_status: "Pago",
      total: "Total",
      date: "Fecha",
      products: "Productos",
      search_placeholder: "Buscar producto...",
      from_date: "Desde",
      to_date: "Hasta",
      load_more: "Cargar más",
    },
  };

  const t = (key: keyof typeof translations.en) =>
    lang === "es" ? translations.es[key] : translations.en[key];

  const getProductName = (product: Product | null | undefined) =>
    product ? (lang === "es" ? product.name_es : product.name_en) : "-";

  const loadOrders = async (reset: boolean = false) => {
    setIsLoading(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (!user || authError) {
      router.replace("/login");
      return;
    }

    let query = supabase
      .from("orders")
      .select(
        `
  id,
  payment_status,
  total_amount,
  tax_amount,
  tax_rate,
  created_at,
  order_items (
    id,
    quantity,
    unit_price,
    subtotal,
    product_id
  )
`
      )

      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);

    const { data: ordersData, error: ordersError } = await query;

    if (ordersError) {
      setError(t("no_access"));
      setOrders([]);
      setIsLoading(false);
      return;
    }

    if (!ordersData || ordersData.length === 0) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    const productIds = Array.from(
      new Set(
        ordersData.flatMap((order: any) =>
          order.order_items.map((item: any) => item.product_id)
        )
      )
    );

    const { data: productsData } = await supabase
      .from("products")
      .select("id, name_en, name_es")
      .in("id", productIds);

    const productMap: Record<string, Product> = {};
    if (productsData) productsData.forEach((p) => (productMap[p.id] = p));
    setProductsMap(productMap);

    const normalizedOrders = ordersData.map((order: any) => ({
      ...order,
      order_items: order.order_items.map((item: any) => ({
        ...item,
        product: productMap[item.product_id] || null,
      })),
    }));

    if (reset) setOrders(normalizedOrders);
    else setOrders((prev) => [...prev, ...normalizedOrders]);

    setHasMore(ordersData.length === pageSize);
    setIsLoading(false);
  };

  useEffect(() => {
    setPage(1);
    loadOrders(true);
  }, [lang, startDate, endDate]);

  const filteredOrders = orders.filter((order) =>
    order.order_items.some((item) =>
      getProductName(item.product).toLowerCase().includes(search.toLowerCase())
    )
  );

  if (isLoading && page === 1)
    return <div className="p-4 text-sm">{t("your_orders")}...</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">{t("your_orders")}</h1>
        <Link href="/">
          <Button variant="outline" size="sm">
            {t("back_home")}
          </Button>
        </Link>
      </div>

      {/* فیلتر تاریخ و جستجو */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          type="text"
          placeholder={t("search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          <Input
            type="date"
            placeholder={t("from_date")}
            value={startDate ?? ""}
            onChange={(e) => setStartDate(e.target.value || null)}
          />
          <Input
            type="date"
            placeholder={t("to_date")}
            value={endDate ?? ""}
            onChange={(e) => setEndDate(e.target.value || null)}
          />
        </div>
      </div>

      {error && <p className="text-red-500 mb-3">{error}</p>}
      {filteredOrders.length === 0 && !error && (
        <p className="text-sm">{t("no_orders")}</p>
      )}

      {filteredOrders.map((order) => (
        <Card key={order.id} className="mb-2 border shadow-sm">
          <CardHeader className="py-0.5 px-3 bg-gray-50">
            <CardTitle className="text-sm md:text-base font-medium">
              #{order.id.slice(0, 8)}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-2 text-sm space-y-1">
            <p className="text-muted-foreground">
              {t("payment_status")}:{" "}
              <span className="font-medium">{order.payment_status}</span>
            </p>
            <p className="text-muted-foreground">
              {t("date")}: {new Date(order.created_at).toLocaleDateString()}
            </p>

            <div className="mt-1">
              <strong>{t("products")}:</strong>
              <div className="space-y-1 mt-1">
                {order.order_items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center border-b pb-1 last:border-none"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {getProductName(item.product)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × ${item.unit_price.toFixed(2)}
                      </p>
                    </div>
                    <div className="font-medium text-sm">
                      ${item.subtotal.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {(() => {
              const subtotal = order.order_items.reduce(
                (s, it) => s + Number(it.subtotal),
                0
              );
              const tax = Number(order.tax_amount ?? 0);
              const total = Number(order.total_amount);

              return (
                <div className="border-t pt-2 mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>
                      IVA ({((order.tax_rate ?? 0.1) * 100).toFixed(0)}%)
                    </span>
                    <span>€{tax.toFixed(2)}</span>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-between items-center pt-1 mt-1 border-t text-sm md:text-base font-semibold">
              <span>{t("total")}</span>
              <span>${order.total_amount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center mt-3">
          <Button
            onClick={() => {
              setPage((prev) => prev + 1);
              loadOrders();
            }}
            variant="outline"
          >
            {t("load_more")}
          </Button>
        </div>
      )}
    </div>
  );
}
