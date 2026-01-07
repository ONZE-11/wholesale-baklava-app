"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createSupabaseClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/language-context";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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

  // Applied filters (used by query)
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Draft filters (UI only)
  const [startDraft, setStartDraft] = useState<string>("");
  const [endDraft, setEndDraft] = useState<string>("");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [hasMore, setHasMore] = useState(true);

  // ✅ Mobile date modal
  const [dateModalOpen, setDateModalOpen] = useState(false);

  const translations = {
    en: {
      your_orders: "Your Orders",
      back_home: "Back to Home",
      no_orders: "No orders found.",
      no_access: "You don’t have access to view orders or something went wrong.",
      payment_status: "Payment",
      total: "Total",
      date: "Date",
      products: "Products",
      search_placeholder: "Search product...",
      from_date: "From",
      to_date: "To",
      load_more: "Load More",
      clear_dates: "Clear",
      apply: "Apply",
      dates: "Dates",
      filter_by_dates: "Filter by dates",
      pick_range: "Pick a date range and press Apply.",
      close: "Close",
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
      clear_dates: "Limpiar",
      apply: "Aplicar",
      dates: "Fechas",
      filter_by_dates: "Filtrar por fechas",
      pick_range: "Selecciona un rango y pulsa Aplicar.",
      close: "Cerrar",
    },
  };

  const t = (key: keyof typeof translations.en) =>
    lang === "es" ? translations.es[key] : translations.en[key];

  function formatOrderDate(dateString?: string | null) {
    if (!dateString) return "—";

    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "—";

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");

    return `${y}/${m}/${day} • ${hh}:${mm}`;
  }

  const getProductName = (product: Product | null | undefined) =>
    product ? (lang === "es" ? product.name_es : product.name_en) : "-";

  // ✅ Clear applied + drafts
  const clearDates = () => {
    setStartDate(null);
    setEndDate(null);
    setStartDraft("");
    setEndDraft("");

    setPage(1);
    setHasMore(true);
  };

  const applyDates = () => {
    setStartDate(startDraft || null);
    setEndDate(endDraft || null);

    setPage(1);
    setHasMore(true);
    setDateModalOpen(false);
  };

  const dateSummary = useMemo(() => {
    const from = startDate || "";
    const to = endDate || "";
    if (!from && !to) return lang === "es" ? "Sin fechas" : "No dates";
    if (from && to) return `${from} → ${to}`;
    if (from) return `${from} → …`;
    return `… → ${to}`;
  }, [startDate, endDate, lang]);

  // ✅ forcedPage برای اینکه setPage async بازی درنیاره
  const loadOrders = async (reset: boolean = false, forcedPage?: number) => {
    setIsLoading(true);
    setError(null);

    const currentPage = forcedPage ?? page;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      router.replace("/login");
      return;
    }

    // ✅ گرفتن profile.id (public.users.id)
    const { data: profileData, error: profileErr } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (profileErr || !profileData?.id) {
      setError("User profile not found");
      setOrders([]);
      setIsLoading(false);
      return;
    }

    const profileId = profileData.id;

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
      .eq("user_id", profileId)
      .order("created_at", { ascending: false })
      .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

    // IMPORTANT: created_at is timestamp, comparing with YYYY-MM-DD works but is day-start.
    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);

    const { data: ordersData, error: ordersError } = await query;

    if (ordersError) {
      setError(t("no_access"));
      if (reset) setOrders([]);
      setIsLoading(false);
      return;
    }

    if (!ordersData || ordersData.length === 0) {
      if (reset) setOrders([]);
      setHasMore(false);
      setIsLoading(false);
      return;
    }

    const productIds = Array.from(
      new Set(
        ordersData.flatMap((order: any) =>
          (order.order_items || []).map((item: any) => item.product_id)
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

    const normalizedOrders: Order[] = ordersData.map((order: any) => ({
      ...order,
      order_items: (order.order_items || []).map((item: any) => ({
        ...item,
        product: productMap[item.product_id] || null,
      })),
    }));

    if (reset) setOrders(normalizedOrders);
    else setOrders((prev) => [...prev, ...normalizedOrders]);

    setHasMore(ordersData.length === pageSize);
    setIsLoading(false);
  };

  // ✅ وقتی تاریخ/زبان عوض شد، همیشه از page=1 لود کن
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadOrders(true, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, startDate, endDate]);

  const filteredOrders = orders.filter((order) =>
    order.order_items.some((item) =>
      getProductName(item.product).toLowerCase().includes(search.toLowerCase())
    )
  );

  if (isLoading && page === 1) {
    return <div className="p-4 text-sm">{t("your_orders")}...</div>;
  }

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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          type="text"
          placeholder={t("search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />

        {/* ✅ Desktop inline date inputs */}
        <div className="hidden sm:flex gap-2 items-center">
          <Input
            type="date"
            value={startDraft}
            onChange={(e) => setStartDraft(e.target.value)}
          />
          <Input
            type="date"
            value={endDraft}
            onChange={(e) => setEndDraft(e.target.value)}
          />

          <Button
            type="button"
            variant="outline"
            disabled={(startDraft || "") === (startDate || "") && (endDraft || "") === (endDate || "")}
            onClick={applyDates}
          >
            {t("apply")}
          </Button>

          <Button type="button" variant="outline" onClick={clearDates}>
            {t("clear_dates")}
          </Button>
        </div>

        {/* ✅ Mobile: open modal instead of inline date inputs */}
        <div className="flex sm:hidden gap-2 items-center">
          <button
            type="button"
            className="border rounded px-3 py-2 text-sm flex-1 text-left"
            onClick={() => {
              // sync draft with applied when opening modal
              setStartDraft(startDate ?? "");
              setEndDraft(endDate ?? "");
              setDateModalOpen(true);
            }}
            title={dateSummary}
          >
            {t("dates")}: <span className="text-muted-foreground">{dateSummary}</span>
          </button>

          <Button type="button" variant="outline" onClick={clearDates}>
            {t("clear_dates")}
          </Button>
        </div>
      </div>

      {/* Mobile Date Dialog */}
      <Dialog open={dateModalOpen} onOpenChange={(v) => setDateModalOpen(v)}>
        <DialogContent className="w-[calc(100vw-24px)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("filter_by_dates")}</DialogTitle>
            <DialogDescription>{t("pick_range")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1">
              <label className="text-xs text-muted-foreground">{t("from_date")}</label>
              <Input
                type="date"
                value={startDraft}
                onChange={(e) => setStartDraft(e.target.value)}
              />
            </div>

            <div className="grid gap-1">
              <label className="text-xs text-muted-foreground">{t("to_date")}</label>
              <Input
                type="date"
                value={endDraft}
                onChange={(e) => setEndDraft(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" type="button" onClick={() => setDateModalOpen(false)}>
              {t("close")}
            </Button>

            <Button variant="outline" type="button" onClick={() => { clearDates(); setDateModalOpen(false); }}>
              {t("clear_dates")}
            </Button>

            <Button
              type="button"
              onClick={applyDates}
              disabled={(startDraft || "") === (startDate || "") && (endDraft || "") === (endDate || "")}
            >
              {t("apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              {t("date")}: {formatOrderDate(order.created_at)}
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
                      <p className="font-medium">{getProductName(item.product)}</p>
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
              const tax = Number(order.tax_amount ?? 0);
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
              const next = page + 1;
              setPage(next);
              loadOrders(false, next);
            }}
            variant="outline"
            disabled={isLoading}
          >
            {t("load_more")}
          </Button>
        </div>
      )}
    </div>
  );
}
