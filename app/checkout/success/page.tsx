"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";
import { useCart } from "@/lib/cart-context";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { lang } = useLanguage();
  const { clearCart } = useCart();

useEffect(() => {
  clearCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  console.log("✅ SUCCESS PAGE LOADED (checkout/success)");


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="bg-white shadow-lg rounded-2xl max-w-lg w-full p-8 sm:p-12 flex flex-col items-center text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-800">
          {t("success.title", lang)}
        </h1>

        <p className="text-gray-600 mb-4 text-sm sm:text-base">
          {t("success.message", lang)}
        </p>

        {orderId && (
          <p className="text-gray-800 font-medium mb-6">
            {t("success.order_number", lang)}: {orderId}
          </p>
        )}

        <Link
          href="/"
          className="inline-block bg-[#8B4513] hover:bg-[#A0522D] text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg text-sm sm:text-base font-medium transition"
        >
          {t("success.back_home", lang)}
        </Link>
      </div>
    </div>
  );
}
