"use client";

import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";

export default function CheckoutCancelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<"en" | "es">("es");

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as "en" | "es" | null;
    const queryLang = searchParams.get("lang") as "en" | "es" | null;

    if (queryLang) {
      setLang(queryLang);
      localStorage.setItem("lang", queryLang);
    } else if (savedLang) {
      setLang(savedLang);
    }
  }, [searchParams]);

  const handleBack = () => {
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("checkout.payment_cancelled", lang)}
        </h1>
        <p className="text-gray-600">{t("checkout.return_try_again", lang)}</p>
        <Button onClick={handleBack}>{t("checkout.back_to_checkout", lang)}</Button>
      </div>
    </div>
  );
}
