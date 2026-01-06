"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import { t } from "@/lib/i18n";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/language-context";
import { useAuthMe } from "@/lib/use-auth-me";

export default function ProductsPage() {
  const { lang } = useLanguage();
  const { addItem } = useCart();

  // ✅ یک منبع واحد برای وضعیت کاربر
  const { loading: authLoading, isAuthenticated, approvalStatus } = useAuthMe();
  const isApproved = approvalStatus === "approved";

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseClient();

    (async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("display_order", { ascending: true });

        if (error) throw error;
        setProducts(data ?? []);
      } catch (error) {
        console.log("Error fetching products:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ✅ وقتی هم auth و هم محصولات آماده نیستند، اسکلت نشان بده
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto mb-12" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-96" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              {t("products.title", lang)}
            </h1>

            {/* ✅ پیام وضعیت برای غیر approved */}
            {!isApproved && (
              <p className="text-muted-foreground text-lg">
                {isAuthenticated
                  ? approvalStatus === "request_docs"
                    ? lang === "es"
                      ? "Se solicitaron documentos. Revisa tu email y complétalos desde el panel."
                      : "Documents were requested. Check your email and complete them from the dashboard."
                    : approvalStatus === "rejected"
                    ? lang === "es"
                      ? "Tu cuenta fue rechazada. Revisa tu email o contacta soporte."
                      : "Your account was rejected. Check your email or contact support."
                    : lang === "es"
                    ? "Tu cuenta está pendiente de aprobación. Puedes ver productos, pero no precios."
                    : "Your account is pending approval. You can browse products, but not see prices."
                  : t("products.register_prompt", lang)}
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                lang={lang}
                isApproved={isApproved}
                isAuthenticated={isAuthenticated}
                approvalStatus={approvalStatus}
                onAddToCart={() =>
                  addItem({
                    productId: product.id,
                    name: product[`name_${lang}`],
                    price: product.price,
                    quantity: product.min_order_quantity,
                    unit: product.unit,
                    imageUrl: product.image_url,
                    min_order_quantity: product.min_order_quantity,
                  })
                }
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
