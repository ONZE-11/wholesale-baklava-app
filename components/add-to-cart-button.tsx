"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useSearchParams } from "next/navigation";
import { t } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

interface AddToCartButtonProps {
  product: any;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const searchParams = useSearchParams();
  const lang = (searchParams.get("lang") as "en" | "es") || "es";
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    const minQ = product?.min_order_quantity ?? 1;

    addItem({
      productId: String(product.id),
      name: lang === "es" ? product.name_es : product.name_en,
      price: product.price,
      quantity: minQ,
      imageUrl: product.image_url,
      unit: product.unit,
      min_order_quantity: minQ, // ✅ اضافه شد
    });

    toast({
      title: lang === "es" ? "Producto agregado" : "Product added",
      description:
        lang === "es"
          ? `${product.name_es} se agregó a su carrito`
          : `${product.name_en} was added to your cart`,
    });
  };

  return (
    <Button
      size="lg"
      className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
      onClick={handleAddToCart}
    >
      {t("products.add_to_cart", lang)}
    </Button>
  );
}
