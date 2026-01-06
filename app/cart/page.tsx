"use client"

import { useEffect, useMemo, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useCart } from "@/lib/cart-context"
import { useRouter } from "next/navigation"
import { t } from "@/lib/i18n"
import { Minus, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

function clampInt(n: number, min: number) {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.floor(n))
}

function QuantityInput({
  item,
  updateQuantity,
}: {
  item: any
  updateQuantity: (productId: string, value: number) => void
}) {
  const minQ = item.min_order_quantity ?? 1

  // متن خام برای اینکه کاربر بتونه راحت تایپ کنه (مثل 536)
  const [raw, setRaw] = useState<string>(String(item.quantity ?? minQ))

  // اگر cart از بیرون تغییر کرد (مثلا clearCart / restore)، sync کن
  useEffect(() => {
    setRaw(String(item.quantity ?? minQ))
  }, [item.quantity, minQ])

  const commit = (value: number) => {
    const finalValue = clampInt(value, minQ)
    updateQuantity(item.productId, finalValue)
    setRaw(String(finalValue))
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    // اجازه بده خالی بشه تا کاربر دوباره تایپ کنه
    if (v === "") {
      setRaw("")
      return
    }
    // فقط عدد/کاراکترهای عددی
    if (!/^\d+$/.test(v)) return
    setRaw(v)
  }

  const onBlur = () => {
    // وقتی کاربر خارج شد، اگر خالی بود حداقل
    if (raw.trim() === "") {
      commit(minQ)
      return
    }
    commit(Number(raw))
  }

  const inc = () => {
    const current = raw.trim() === "" ? minQ : Number(raw)
    commit((Number.isFinite(current) ? current : minQ) + 1)
  }

  const dec = () => {
    const current = raw.trim() === "" ? minQ : Number(raw)
    commit((Number.isFinite(current) ? current : minQ) - 1)
  }

  return (
    <div className="flex items-center gap-2">
      {/* دکمه کم کردن */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={dec}
        className="h-9 w-9 shrink-0"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </Button>

      {/* ورودی عدد */}
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={raw}
        onChange={onChange}
        onBlur={onBlur}
        className="w-20 text-center"
        aria-label="Quantity"
      />

      {/* دکمه زیاد کردن */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={inc}
        className="h-9 w-9 shrink-0"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </Button>

      {/* نمایش حداقل */}
      <span className="hidden sm:inline text-xs text-muted-foreground">
        min {minQ}
      </span>
    </div>
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
            <h1 className="text-3xl font-bold mb-4">{t("cart.title", lang)}</h1>
            <p className="text-muted-foreground mb-8">{t("cart.empty", lang)}</p>
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
          <h1 className="text-3xl font-bold mb-8">{t("cart.title", lang)}</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.productId}>
                  <CardContent className="p-4 sm:p-6">
                    {/* موبایل: چیدمان ستونی، دسکتاپ: ردیفی */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative w-full sm:w-24 h-48 sm:h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 truncate">{item.name}</h3>
                        <p className="text-muted-foreground mb-3">
                          €{item.price} / {item.unit}
                        </p>

                        {/* کنترل‌ها */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {t("cart.quantity", lang)}:
                            </span>

                            <QuantityInput item={item} updateQuantity={updateQuantity} />
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.productId)}
                            className="justify-start sm:justify-center"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t("cart.remove", lang)}
                          </Button>
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-xl sm:text-2xl font-bold text-primary">
                          €{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <div>
              <Card className="sticky top-20">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold">
                    {t("checkout.order_summary", lang)}
                  </h2>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg">
                      <span>{t("cart.subtotal", lang)}:</span>
                      <span className="font-bold">€{totalPrice.toFixed(2)}</span>
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
