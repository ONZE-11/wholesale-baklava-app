"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useCart } from "@/lib/cart-context"
import { useRouter } from "next/navigation"
import { t } from "@/lib/i18n"
import { Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

function QuantityInput({
  item,
  updateQuantity,
}: {
  item: any
  updateQuantity: (productId: string, value: number) => void
}) {
  const [localQuantity, setLocalQuantity] = useState(item.quantity)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === "") return

    const value = Number(raw)
    if (Number.isNaN(value)) return

    const finalValue = Math.max(value, item.min_order_quantity)
    updateQuantity(item.productId, finalValue)
    setLocalQuantity(finalValue)
  }

  return (
    <Input
      type="number"
      min={item.min_order_quantity}
      value={localQuantity}
      onChange={handleChange}
      className="w-20"
    />
  )
}

export default function CartPage() {
  const router = useRouter()
  const { lang } = useLanguage()
  const { items, removeItem, updateQuantity, totalPrice } = useCart()

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold mb-4">
              {t("cart.title", lang)}
            </h1>
            <p className="text-muted-foreground mb-8">
              {t("cart.empty", lang)}
            </p>
            <Link href="/products">
              <Button>{t("cart.continue_shopping", lang)}</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">
            {t("cart.title", lang)}
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.productId}>
                  <CardContent className="p-6 flex gap-4">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={item.imageUrl || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">
                        {item.name}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        €{item.price} / {item.unit}
                      </p>

                      <div className="flex items-center gap-4">
                        <label className="text-sm">
                          {t("cart.quantity", lang)}:
                        </label>

                        <QuantityInput
                          item={item}
                          updateQuantity={updateQuantity}
                        />

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.productId)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t("cart.remove", lang)}
                        </Button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        €{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold">
                    {t("checkout.order_summary", lang)}
                  </h2>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg">
                      <span>{t("cart.subtotal", lang)}:</span>
                      <span className="font-bold">
                        €{totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push("/checkout")}
                    className="w-full"
                    size="lg"
                  >
                    {t("cart.checkout", lang)}
                  </Button>

                  <Link href="/products">
                    <Button variant="outline" className="w-full bg-transparent">
                      {t("cart.continue_shopping", lang)}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
