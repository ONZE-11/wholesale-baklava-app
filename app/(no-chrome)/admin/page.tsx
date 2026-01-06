"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";

type Stats = {
  orders: number;
  users: number;
  revenue: number;
};

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

export default function AdminDashboardPage() {
  const { lang } = useLanguage();
  const safeLang: "en" | "es" = lang === "en" ? "en" : "es";

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const currency = "EUR";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || !json?.success) {
          throw new Error(json?.error || "Failed to load dashboard");
        }

        if (!cancelled) setStats(json.data);
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
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{t("nav.dashboard", safeLang)}</h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.dashboard.subtitle", safeLang)}
        </p>
      </div>

      {loading && <div className="text-sm">{t("common.loading", safeLang)}</div>}
      {err && <div className="text-sm text-red-600 whitespace-pre-wrap">{err}</div>}

      {!loading && !err && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="border rounded-lg bg-white p-4">
            <div className="text-xs text-muted-foreground">
              {t("admin.dashboard.card.orders", safeLang)}
            </div>
            <div className="text-lg font-bold">{stats?.orders ?? 0}</div>
          </div>

          <div className="border rounded-lg bg-white p-4">
            <div className="text-xs text-muted-foreground">
              {t("admin.dashboard.card.users", safeLang)}
            </div>
            <div className="text-lg font-bold">{stats?.users ?? 0}</div>
          </div>

          <div className="border rounded-lg bg-white p-4">
            <div className="text-xs text-muted-foreground">
              {t("admin.dashboard.card.revenue", safeLang)}
            </div>
            <div className="text-lg font-bold">
              {money(stats?.revenue ?? 0, currency)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
