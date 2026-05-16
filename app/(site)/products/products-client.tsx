"use client";

import { ProductCard } from "@/components/product-card";
import { t } from "@/lib/i18n";
import { useCart } from "@/lib/cart-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/language-context";
import { useAuthMe } from "@/lib/use-auth-me";

type ApprovalStatus = "pending" | "approved" | "rejected" | "request_docs" | string;

interface ProductsClientProps {
  initialProducts: any[];
  initialIsAuthenticated: boolean;
  initialApprovalStatus: ApprovalStatus;
}

export default function ProductsClient({
  initialProducts,
  initialIsAuthenticated,
  initialApprovalStatus,
}: ProductsClientProps) {
  const { lang } = useLanguage();
  const { addItem } = useCart();

  // Client-side auth re-validation runs in the background.
  // While it's loading we fall back to the server-provided values so the
  // page renders immediately without a skeleton.
  const {
    loading: authLoading,
    isAuthenticated: clientIsAuthenticated,
    approvalStatus: clientApprovalStatus,
  } = useAuthMe();

  const isAuthenticated = authLoading ? initialIsAuthenticated : clientIsAuthenticated;
  const approvalStatus = authLoading ? initialApprovalStatus : clientApprovalStatus;
  const isApproved = approvalStatus === "approved";

  // Fallback skeleton — only reachable if initialProducts is empty AND auth is
  // still loading, which should be extremely rare with server-side fetching.
  if (initialProducts.length === 0 && authLoading) {
    return (
      <main className="py-12">
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
    );
  }

  return (
    <main className="py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {t("products.title", lang)}
          </h1>

          {!isApproved && (
            <p className="text-muted-foreground text-lg">
              {isAuthenticated &&
                (approvalStatus === "request_docs"
                  ? lang === "es"
                    ? "Se solicitaron documentos. Revisa tu email y complétalos desde el panel."
                    : "Documents were requested. Check your email and complete them from the dashboard."
                  : approvalStatus === "rejected"
                    ? lang === "es"
                      ? "Tu cuenta fue rechazada. Revisa tu email o contacta soporte."
                      : "Your account was rejected. Check your email or contact support."
                    : lang === "es"
                      ? "Tu cuenta está pendiente de aprobación. Puedes ver productos, pero no precios."
                      : "Your account is pending approval. You can browse products, but not see prices.")}
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              lang={lang}
              isApproved={isApproved}
              isAuthenticated={isAuthenticated}
              approvalStatus={approvalStatus}
              priority={index < 3}
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
  );
}
