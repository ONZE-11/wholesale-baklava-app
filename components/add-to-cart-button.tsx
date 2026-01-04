"use client"

import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { useSearchParams } from "next/navigation"
import { t } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"

interface AddToCartButtonProps {
  product: any
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const searchParams = useSearchParams()
  const lang = (searchParams.get("lang") as "en" | "es") || "es"
  const { addItem } = useCart()
  const { toast } = useToast()

  const handleAddToCart = () => {
   addItem({
  productId: product.id, // ✅ همانطور که CartItem تعریف شده
  name: lang === "es" ? product.name_es : product.name_en,
  price: product.price,
  quantity: product.min_order_quantity || 1,
  imageUrl: product.image_url, // ✅ مطابق CartItem
  unit: product.unit,
})


    toast({
      title: lang === "es" ? "Producto agregado" : "Product added",
      description:
        lang === "es"
          ? `${lang === "es" ? product.name_es : product.name_en} se agregó a su carrito`
          : `${lang === "en" ? product.name_es : product.name_en} was added to your cart`,
    })
  }

  return (
    <Button
      size="lg"
      className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
      onClick={handleAddToCart}
    >
      {t("products.add_to_cart", lang)}
    </Button>
  )
}
