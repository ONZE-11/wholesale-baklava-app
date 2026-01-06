"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { CreditCard, Banknote } from "lucide-react";

import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/i18n";
import { calcTotalsFromItems, IVA_PERCENT } from "@/lib/tax";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();

  const totals = useMemo(() => {
    return calcTotalsFromItems(
      (items ?? []).map((it) => ({
        price: Number(it.price),
        quantity: Number(it.quantity),
      }))
    );
  }, [items]);

  const { toast } = useToast();
  const { lang } = useLanguage();

  const [user, setUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "cash">("stripe");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    shippingAddress: "",
    city: "",
    phone: "",
    postalCode: "",
    country: "",
    notes: "",
  });

  useEffect(() => {
    async function fetchUser() {
      const supabase = createSupabaseClient();

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const authUser = userData.user;
      if (!authUser) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authUser.id)
        .single();

      if (profile) {
        setUser(profile);
        setFormData({
          fullName: profile.business_name || "",
          shippingAddress: profile.address || "",
          city: profile.city || "",
          phone: profile.phone || "",
          postalCode: profile.postal_code || "",
          country: profile.country || "",
          notes: "",
        });
      }
    }

    fetchUser();

    if (!orderPlaced && items.length === 0) {
      router.replace("/cart");
    }
  }, [router, items.length, orderPlaced]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const supabase = createSupabaseClient();

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        toast({
          title: t("checkout.unauthorized", lang),
          description: t("checkout.login_required", lang),
          variant: "destructive",
        });
        router.replace("/login");
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const authUser = userData.user;
      if (!authUser) {
        router.replace("/login");
        return;
      }

      // ✅ ساخت آدرس به شکل آبجکت (برای ذخیره داخل orders.shipping_address jsonb)
      const shippingAddressObj = {
        full_name: formData.fullName,
        phone: formData.phone,
        address: formData.shippingAddress,
        city: formData.city,
        postal_code: formData.postalCode,
        country: formData.country,
      };

      // ✅ ولیدیشن ساده برای ارسال فیزیکی
      if (
        !shippingAddressObj.full_name ||
        !shippingAddressObj.phone ||
        !shippingAddressObj.address ||
        !shippingAddressObj.city ||
        !shippingAddressObj.postal_code ||
        !shippingAddressObj.country
      ) {
        throw new Error("Shipping address is required");
      }

      if (paymentMethod === "stripe") {
        // 1) ساخت سفارش در دیتابیس
        const orderRes = await fetch("/api/orders", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items,
            shippingAddress: shippingAddressObj,
            paymentMethod: "stripe",
            notes: formData.notes,
          }),
        });

        const orderJson = await orderRes.json();

        if (!orderRes.ok || !orderJson?.orderId) {
          throw new Error(orderJson?.error || "Failed to create order");
        }

        const orderId = orderJson.orderId;

        // 2) ساخت سشن Stripe
        const res = await fetch("/api/stripe/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items,
            orderId,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data?.url) {
          throw new Error(data?.error || t("checkout.stripe_error", lang));
        }

        localStorage.setItem("lastOrderId", orderId); // اختیاری
        window.location.href = data.url;
        return;
      }

      // Cash on Delivery
      const res = await fetch("/api/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          shippingAddress: shippingAddressObj, // ✅ آبجکت
          paymentMethod: "cash",
          notes: formData.notes,
        }),
      });

      const data: any = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("checkout.order_failed", lang));
      }

      setOrderPlaced(true);
      toast({
        title: t("checkout.order_placed", lang),
        description: t("checkout.pay_on_delivery", lang),
      });

      router.replace(`/checkout/success?orderId=${data.orderId}`);
      clearCart();
    } catch (err: any) {
      toast({
        title: t("checkout.error", lang),
        description: err.message || t("checkout.error_generic", lang),
        variant: "destructive",
      });
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">{t("checkout.title", lang)}</h1>

        <form onSubmit={handlePlaceOrder} className="grid lg:grid-cols-3 gap-8">
          {/* LEFT: Shipping & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t("checkout.shipping_info", lang)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("checkout.full_name", lang)}</Label>
                  <Input
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("checkout.shipping_address", lang)}</Label>
                  <Input
                    required
                    value={formData.shippingAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, shippingAddress: e.target.value })
                    }
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("checkout.city", lang)}</Label>
                    <Input
                      required
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("checkout.phone", lang)}</Label>
                    <Input
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* ✅ Postal code + Country */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("checkout.postal_code", lang) || "Postal Code"}</Label>
                    <Input
                      required
                      value={formData.postalCode}
                      onChange={(e) =>
                        setFormData({ ...formData, postalCode: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("checkout.country", lang) || "Country"}</Label>
                    <Input
                      required
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("checkout.notes", lang)}</Label>
                  <Textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t("checkout.payment_method", lang)}</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as "stripe" | "cash")}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer">
                    <RadioGroupItem value="stripe" id="stripe" />
                    <Label htmlFor="stripe" className="flex gap-2 items-center">
                      <CreditCard className="h-4 w-4" />
                      {t("checkout.pay_with_card", lang)}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex gap-2 items-center">
                      <Banknote className="h-4 w-4" />
                      {t("checkout.cash_on_delivery", lang)}
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t("checkout.order_summary", lang)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>€{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>€{totals.subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>IVA ({IVA_PERCENT}%)</span>
                    <span>€{totals.tax.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-lg font-bold pt-2">
                    <span>{t("checkout.total", lang)}</span>
                    <span className="text-primary">€{totals.total.toFixed(2)}</span>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isProcessing}>
                  {isProcessing
                    ? t("checkout.redirecting", lang)
                    : t("checkout.place_order", lang)}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
