"use client";

import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { t } from "@/lib/i18n";

export default function CheckoutCancelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [lang, setLang] = useState<"en" | "es">("es");
  const [isCancelling, setIsCancelling] = useState(true);

  const orderId = useMemo(() => searchParams.get("orderId"), [searchParams]);

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

  // ✅ مهم: همینجا سفارش را cancel کن
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!orderId) return;

        await fetch("/api/orders/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
      } catch {
        // عمدا چیزی نشان نمی‌دهیم، چون حتی اگر fail شود هم صفحه باید لود شود
      } finally {
        if (!cancelled) setIsCancelling(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const handleBack = () => {
    router.push("/cart");
  };

  const handleTryAgain = () => {
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-xl shadow text-center space-y-4 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("checkout.payment_cancelled", lang)}
        </h1>

        <p className="text-gray-600">
          {isCancelling
            ? (lang === "es" ? "Cancelando tu pedido..." : "Cancelling your order...")
            : t("checkout.return_try_again", lang)}
        </p>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={handleBack}>
            {lang === "es" ? "Volver al carrito" : "Back to cart"}
          </Button>

          <Button onClick={handleTryAgain} disabled={isCancelling}>
            {t("checkout.back_to_checkout", lang)}
          </Button>
        </div>
      </div>
    </div>
  );
}
