"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/i18n";

async function safeReadJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { __raw: text };
  }
}

function normalizeId(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
  return "";
}

function n(v: any): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function money(v: any, currency = "EUR") {
  const num = n(v);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function shortId(id: string) {
  if (!id) return "—";
  const s = String(id);
  return s.length > 10 ? `${s.slice(0, 8)}…${s.slice(-4)}` : s;
}

function formatYMD(dateInput: string) {
  if (!dateInput) return "—";

  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "—";

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");

  // هم‌فرم با فایل قبلی + فاصله تمیز
  return `${y}/${m}/${day}  ,  ${hh}:${mm}`;
}


function badgeClass(kind: "status" | "pay", value: string) {
  // بدون وسواس روی رنگ ها. فقط قابل تشخیص.
  if (kind === "pay") {
    if (value === "paid") return "bg-green-600 text-white";
    if (value === "unpaid") return "bg-gray-600 text-white";
    if (value === "refunded") return "bg-red-600 text-white";
    return "bg-gray-500 text-white";
  }
  // status
  if (value === "delivered") return "bg-green-600 text-white";
  if (value === "shipped") return "bg-blue-600 text-white";
  if (value === "pending") return "bg-gray-600 text-white";
  if (value === "cancelled") return "bg-red-600 text-white";
  if (value === "processing") return "bg-yellow-600 text-white";
  return "bg-gray-500 text-white";
}

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const rawId = (params as any)?.id;
  const orderId = useMemo(() => normalizeId(rawId), [rawId]);

  const { lang } = useLanguage();
  const safeLang: "en" | "es" = lang === "es" ? "es" : "en";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [status, setStatus] = useState<string>("pending");
  const [paymentStatus, setPaymentStatus] = useState<string>("unpaid");
  const [saving, setSaving] = useState(false);

  const currency = "EUR";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      setData(null);

      if (!orderId || orderId === "undefined") {
        setErr("Invalid order id");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
          cache: "no-store",
        });

        const json: any = await safeReadJson(res);

        if (!res.ok) {
          throw new Error(
            json?.error ||
              (json?.__raw
                ? `Non-JSON response (status ${res.status}): ${String(json.__raw).slice(0, 200)}`
                : "Failed to load order")
          );
        }

        if (!cancelled) {
          setData(json);
          setStatus(json?.order?.status || "pending");
          setPaymentStatus(json?.order?.payment_status || "unpaid");
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  async function patchOrder(payload: any) {
    if (!orderId || orderId === "undefined") {
      setErr("Invalid order id");
      return null;
    }

    setErr(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json: any = await safeReadJson(res);

      if (!res.ok) {
        setErr(json?.error || "Failed to update order");
        return null;
      }

      return json;
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus() {
    const json = await patchOrder({ status });
    if (!json) return;

    setData((prev: any) => ({
      ...prev,
      order: { ...prev.order, status: json?.data?.status ?? status },
    }));
  }

  async function updatePaymentStatus() {
    const json = await patchOrder({ payment_status: paymentStatus });
    if (!json) return;

    setData((prev: any) => ({
      ...prev,
      order: {
        ...prev.order,
        payment_status: json?.data?.payment_status ?? paymentStatus,
      },
    }));
  }

  if (loading) return <p className="text-sm">{t("common.loading", safeLang)}</p>;

  if (err) {
    return (
      <div className="space-y-2">
        <p className="text-red-600 whitespace-pre-wrap text-sm">{err}</p>
        <p className="text-xs text-muted-foreground">
          Debug: raw id = <span className="font-mono">{String(rawId)}</span> | normalized ={" "}
          <span className="font-mono">{orderId || "(empty)"}</span>
        </p>
      </div>
    );
  }

  if (!data?.order) return <p className="text-sm">Not found</p>;

  const order = data.order;
  const items = data.items || [];
  const addr = order.shipping_address || null;

  const customerEmail =
    data?.user_email || data?.customer?.email || data?.user?.email || order?.user_email || null;

  const businessName =
    data?.business_name ||
    data?.customer?.business_name ||
    data?.user?.business_name ||
    order?.business_name ||
    null;

  const subtotal = items.reduce((s: number, it: any) => {
    const rowSubtotal = n(it.subtotal ?? it.unit_price * it.quantity);
    return s + rowSubtotal;
  }, 0);

  const tax = n(order.tax_amount ?? 0);
  const total = n(order.total_amount ?? subtotal + tax);
  const rate = n(order.tax_rate ?? 0.1);
  const ratePct = (rate * 100).toFixed(0);

  const headerCustomer = businessName || customerEmail || shortId(order.user_id);

  return (
    <div className="space-y-4">
      {/* ===== Header: مهم‌ترین اطلاعات + Badge ها ===== */}
      <div className="rounded-lg border p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="text-lg font-bold">
              {t("dashboard.order_number", safeLang)}{" "}
              <span className="font-mono text-sm">{shortId(order.id)}</span>
            </div>

            <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
              <span>
                {t("dashboard.order_date", safeLang)}: {formatYMD(order.created_at)}
              </span>
              <span>
                {t("admin.orders.customer", safeLang)}: <b className="text-foreground">{headerCustomer}</b>
              </span>
              {customerEmail && (
                <span>
                  {t("auth.email", safeLang)}: <span className="text-foreground">{customerEmail}</span>
                </span>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              {t("order.payment", safeLang)}:{" "}
              <span className="text-foreground font-medium">{order.payment_method || "—"}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${badgeClass("status", status)}`}>
              {status}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${badgeClass("pay", paymentStatus)}`}>
              {paymentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* ===== Quick actions: کنترل‌ها بالای صفحه ===== */}
      <div className="rounded-lg border p-3 grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground">Order status</div>
          <div className="flex items-center gap-2">
            <select
              className="border rounded px-3 py-2 flex-1 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={saving}
            >
              <option value="pending">pending</option>
              <option value="processing">processing</option>
              <option value="shipped">shipped</option>
              <option value="delivered">delivered</option>
              <option value="cancelled">cancelled</option>
            </select>
            <button
              className="border rounded px-3 py-2 text-sm"
              onClick={updateStatus}
              disabled={saving}
            >
              {saving ? "Saving..." : "Update"}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground">Payment status</div>
          <div className="flex items-center gap-2">
            <select
              className="border rounded px-3 py-2 flex-1 text-sm"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              disabled={saving}
            >
              <option value="unpaid">unpaid</option>
              <option value="paid">paid</option>
              <option value="refunded">refunded</option>
            </select>
            <button
              className="border rounded px-3 py-2 text-sm"
              onClick={updatePaymentStatus}
              disabled={saving}
            >
              {saving ? "Saving..." : "Update"}
            </button>
          </div>
        </div>
      </div>

      {/* ===== Summary: اعداد اصلی ===== */}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="border rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Subtotal</div>
          <div className="text-lg font-bold">{money(subtotal, currency)}</div>
        </div>
        <div className="border rounded-lg p-3">
          <div className="text-xs text-muted-foreground">IVA ({ratePct}%)</div>
          <div className="text-lg font-bold">{money(tax, currency)}</div>
        </div>
        <div className="border rounded-lg p-3">
          <div className="text-xs text-muted-foreground">{t("dashboard.order_total", safeLang)}</div>
          <div className="text-lg font-bold">{money(total, currency)}</div>
        </div>
        <div className="border rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Items</div>
          <div className="text-lg font-bold">{items.length}</div>
        </div>
      </div>

      {/* ===== Notes + Shipping ===== */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="border rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Notes</div>
          <div className="mt-1 text-sm">{order.notes || "—"}</div>
        </div>

        <div className="border rounded-lg p-3">
          <h2 className="font-bold text-sm mb-2">Shipping</h2>

          {!addr ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Full name</div>
                <div className="font-medium">{addr.full_name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Phone</div>
                <div className="font-medium">{addr.phone}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-muted-foreground">Address</div>
                <div className="font-medium">{addr.address}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">City</div>
                <div className="font-medium">{addr.city}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Postal</div>
                <div className="font-medium">{addr.postal_code}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Country</div>
                <div className="font-medium">{addr.country}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Items Table ===== */}
      <div className="border rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-sm">Items</h2>
          <div className="text-sm">
            <span className="text-muted-foreground mr-2">Total:</span>
            <b>{money(total, currency)}</b>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-2 text-left">Product</th>
                <th className="border px-2 py-2 text-center w-20">Qty</th>
                <th className="border px-2 py-2 text-center w-28">Unit</th>
                <th className="border px-2 py-2 text-center w-32">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it: any) => {
                const name =
                  safeLang === "es"
                    ? it.name_es ?? it.products?.name_es ?? "—"
                    : it.name_en ?? it.products?.name_en ?? "—";

                const rowSubtotal = n(it.subtotal ?? it.unit_price * it.quantity);

                return (
                  <tr key={it.id}>
                    <td className="border px-2 py-2">{name}</td>
                    <td className="border px-2 py-2 text-center">{it.quantity}</td>
                    <td className="border px-2 py-2 text-center">{money(it.unit_price, currency)}</td>
                    <td className="border px-2 py-2 text-center">{money(rowSubtotal, currency)}</td>
                  </tr>
                );
              })}

              {items.length === 0 && (
                <tr>
                  <td className="border px-2 py-6 text-center" colSpan={4}>
                    No items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 border-t pt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <b>{money(subtotal, currency)}</b>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">IVA ({ratePct}%)</span>
            <b>{money(tax, currency)}</b>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <b>{money(total, currency)}</b>
          </div>
        </div>
      </div>
    </div>
  );
}
