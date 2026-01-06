"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const supabase = createSupabaseClient();

  const { lang, setLang } = useLanguage();
  const safeLang: "en" | "es" = lang === "en" ? "en" : "es";

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkAdmin() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!cancelled) setLoading(false);
        router.push(`/login`);
        return;
      }

      const { data: userData, error } = await supabase
        .from("users")
        .select("role")
        .eq("auth_id", session.user.id)
        .single();

      if (error || userData?.role !== "admin") {
        if (!cancelled) setLoading(false);
        router.push(`/`);
        return;
      }

      if (!cancelled) setLoading(false);
    }

    checkAdmin();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span>{t("common.loading", safeLang)}</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col">
        <h2 className="text-xl mb-4">{t("nav.admin", safeLang)}</h2>

        <nav className="flex flex-col gap-2 flex-1 text-sm">
          <Link href="/admin">{t("nav.dashboard", safeLang)}</Link>
          <Link href="/admin/users">{t("nav.users", safeLang)}</Link>
          <Link href="/admin/orders">{t("nav.orders", safeLang)}</Link>
          <Link href="/admin/products">{t("nav.products", safeLang)}</Link>
          <Link href="/admin/reports">{t("nav.reports", safeLang)}</Link>
          <Link href="/admin/settings">{t("nav.settings", safeLang)}</Link>
        </nav>

        {/* ✅ زبان پایین سایدبار */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="text-xs text-gray-300">Language</div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setLang("es")}
              className={`px-2 py-1 rounded text-xs ${
                safeLang === "es" ? "bg-gray-600" : "bg-gray-700"
              }`}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-2 py-1 rounded text-xs ${
                safeLang === "en" ? "bg-gray-600" : "bg-gray-700"
              }`}
            >
              EN
            </button>
          </div>
        </div>

        <button
          onClick={() => router.push(`/`)}
          className="mt-3 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          type="button"
        >
          {t("back_home", safeLang)}
        </button>
      </aside>

      <main className="flex-1 bg-gray-100 p-6">{children}</main>
    </div>
  );
}
