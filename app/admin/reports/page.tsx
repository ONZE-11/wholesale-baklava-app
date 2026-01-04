"use client";

import { t } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";

export default function AdminReportsPage() {
  const { lang } = useLanguage();
  const safeLang: "en" | "es" = lang === "en" ? "en" : "es";

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">{t("nav.reports", safeLang)}</h1>

      <div className="border rounded-lg bg-white p-4 text-sm text-muted-foreground">
        {t("admin.reports.coming_soon", safeLang)}
      </div>
    </div>
  );
}
