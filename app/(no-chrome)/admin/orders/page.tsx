"use client";

import { t } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type OrderRow = {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  user_id: string;
  payment_method: string | null;
  user_email?: string | null;
  business_name?: string | null;
};

async function safeReadJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { __raw: text };
  }
}

function shortId(id: string) {
  if (!id) return "—";
  const clean = String(id);
  return clean.length > 10 ? `${clean.slice(0, 8)}…${clean.slice(-4)}` : clean;
}

function displayCustomer(o: OrderRow) {
  const bn = (o.business_name || "").trim();
  const em = (o.user_email || "").trim();
  if (bn) return bn;
  if (em) return em;
  return shortId(o.user_id);
}

function money(v: any, currency = "EUR") {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatYMD(dateInput: string) {
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

export default function AdminOrdersPage() {
  const { lang } = useLanguage();
  const safeLang: "en" | "es" = lang === "es" ? "es" : "en";

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("");

  // Search (server-side)
  const [q, setQ] = useState<string>("");

  // Date range inputs (draft)
  const [dateFromDraft, setDateFromDraft] = useState<string>("");
  const [dateToDraft, setDateToDraft] = useState<string>("");

  // Applied date range (what actually goes to API)
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 50;

  const currency = "EUR";

  // وقتی سرچ/وضعیت/بازه اعمال‌شده تغییر کرد، برگرد صفحه 1
  useEffect(() => {
    setPage(1);
  }, [statusFilter, q, dateFrom, dateTo]);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("page", String(page));
    sp.set("pageSize", String(pageSize));
    if (statusFilter) sp.set("status", statusFilter);
    if (q.trim()) sp.set("q", q.trim());
    if (dateFrom) sp.set("dateFrom", dateFrom); // YYYY-MM-DD
    if (dateTo) sp.set("dateTo", dateTo); // YYYY-MM-DD
    return sp.toString();
  }, [page, pageSize, statusFilter, q, dateFrom, dateTo]);

  useEffect(() => {
    let cancelled = false;

    async function fetchOrders() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/admin/orders?${queryString}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        const payload: any = await safeReadJson(res);

        if (!res.ok) {
          const msg =
            payload?.error ||
            (payload?.__raw
              ? `Non-JSON response (status ${res.status}): ${String(
                  payload.__raw
                ).slice(0, 300)}`
              : `Request failed (status ${res.status})`);
          throw new Error(msg);
        }

        if (!cancelled) {
          setOrders(payload?.data || []);
          setTotal(payload?.meta?.total ?? 0);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOrders();
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const canApplyDates = dateFromDraft !== dateFrom || dateToDraft !== dateTo;

  function applyDates() {
    // اگر یکی پره و اون یکی نه، اشکالی نداره (فقط from یا فقط to)
    setDateFrom(dateFromDraft);
    setDateTo(dateToDraft);
  }

  function clearDates() {
    setDateFromDraft("");
    setDateToDraft("");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">
          {t("admin.orders.title", safeLang)}
        </h1>

        <div className="flex flex-wrap gap-2 items-end">
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder={t("common.search_placeholder", safeLang)}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="border rounded px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">{t("common.all_statuses", safeLang)}</option>
            <option value="pending">pending</option>
            <option value="shipped">shipped</option>
            <option value="delivered">delivered</option>
            <option value="cancelled">cancelled</option>
          </select>

          {/* Date range (draft) */}
          <div className="flex gap-2 items-end">
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground">
                {safeLang === "es" ? "Desde" : "From"}
              </label>
              <input
                type="date"
                className="border rounded px-3 py-2 text-sm"
                value={dateFromDraft}
                onChange={(e) => setDateFromDraft(e.target.value)}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground">
                {safeLang === "es" ? "Hasta" : "To"}
              </label>
              <input
                type="date"
                className="border rounded px-3 py-2 text-sm"
                value={dateToDraft}
                onChange={(e) => setDateToDraft(e.target.value)}
              />
            </div>

            <button
              className="border rounded px-3 py-2 text-sm disabled:opacity-50"
              disabled={!canApplyDates}
              onClick={applyDates}
            >
              {safeLang === "es" ? "Aplicar" : "Apply"}
            </button>

            <button
              className="border rounded px-3 py-2 text-sm"
              onClick={clearDates}
            >
              {safeLang === "es" ? "Limpiar" : "Clear"}
            </button>
          </div>
        </div>
      </div>

      {loading && <p className="text-sm">{t("common.loading", safeLang)}</p>}
      {error && (
        <p className="text-red-600 whitespace-pre-wrap text-sm">{error}</p>
      )}

      {!loading && !error && (
        <>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="bg-muted/30">
                  <th className="border-b px-2 py-2 text-left">
                    {t("admin.orders.order_id", safeLang)}
                  </th>
                  <th className="border-b px-2 py-2 text-left">
                    {t("admin.orders.customer", safeLang)}
                  </th>
                  <th className="border-b px-2 py-2 text-left">
                    {t("admin.orders.date", safeLang)}
                  </th>
                  <th className="border-b px-2 py-2 text-left">
                    {t("admin.orders.status", safeLang)}
                  </th>
                  <th className="border-b px-2 py-2 text-right">
                    {t("admin.orders.total", safeLang)}
                  </th>
                  <th className="border-b px-2 py-2 text-center w-24">
                    {t("common.actions", safeLang)}
                  </th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/20">
                    <td className="border-b px-2 py-2 font-mono text-xs">
                      {shortId(order.id)}
                    </td>
                    <td className="border-b px-2 py-2">
                      {displayCustomer(order)}
                    </td>
                    <td className="border-b px-2 py-2">
                      {formatYMD(order.created_at)}
                    </td>
                    <td className="border-b px-2 py-2">{order.status}</td>
                    <td className="border-b px-2 py-2 text-right">
                      {money(order.total_amount, currency)}
                    </td>
                    <td className="border-b px-2 py-2 text-center">
                      <Link
                        href={`/admin/orders/${order.id}?lang=${safeLang}`}
                        className="underline"
                      >
                        {t("common.view", safeLang)}
                      </Link>
                    </td>
                  </tr>
                ))}

                {orders.length === 0 && (
                  <tr>
                    <td
                      className="px-2 py-6 text-center text-muted-foreground"
                      colSpan={6}
                    >
                      {t("admin.orders.no_orders", safeLang)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              Page <b>{page}</b> / <b>{totalPages}</b> · Total: <b>{total}</b>
            </div>

            <div className="flex gap-2">
              <button
                className="border rounded px-3 py-2 disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                className="border rounded px-3 py-2 disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
