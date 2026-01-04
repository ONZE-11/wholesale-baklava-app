"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Lock, Package, Clock, Refrigerator, List } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart-context";
import { useLanguage } from "@/lib/language-context";
import { useToast } from "@/hooks/use-toast";
import { Label } from "recharts";

type Product = {
  id: string | number;
  price: number;
  unit: string;
  image_url: string;
  min_order_quantity: number;

  // localized fields (dynamic)
  [key: string]: any;
};

function clampInt(value: number, min: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.floor(value));
}

function isProfileIncomplete(p: any) {
  return (
    !p?.business_name ||
    !p?.cif ||
    !p?.phone ||
    !p?.address ||
    !p?.city ||
    !p?.country
  );
}

export default function ProductDetailsPage() {
  const params = useParams();
  const rawId = params?.id;

  // id can be string | string[] in Next
  const id = useMemo(() => (Array.isArray(rawId) ? rawId[0] : rawId), [rawId]);

  const { lang } = useLanguage();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const { addItem } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  const [quantity, setQuantity] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // fetch: user approval
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (!user) {
          setIsApproved(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("approval_status, business_name, cif, phone, address, city, country")
          .eq("auth_id", user.id)
          .maybeSingle();

        if (!mounted) return;

        if (profileError) {
          console.error("profile fetch error:", profileError);
          setIsApproved(false);
          return;
        }

        // اگر خواستی، می‌تونی ناقص بودن پروفایل رو هم اینجا به کاربر نشون بدی
        // const incomplete = isProfileIncomplete(profile);

        setIsApproved(profile?.approval_status === "approved");
      } catch (e) {
        console.error("approval check error:", e);
        if (mounted) setIsApproved(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  // fetch: product
  useEffect(() => {
    if (!id) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const { data: prod, error: prodError } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();

        if (!mounted) return;

        if (prodError || !prod) {
          console.error("product fetch error:", prodError);
          setError(lang === "es" ? "Producto no encontrado." : "Product not found.");
          setProduct(null);
          return;
        }

        setProduct(prod as Product);

        const minQ = (prod as Product).min_order_quantity ?? 1;
        setQuantity(minQ);
      } catch (e) {
        console.error("Error fetching product:", e);
        if (mounted) {
          setError(lang === "es" ? "Error cargando el producto." : "Failed to load product.");
          setProduct(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, supabase, lang]);

  const localized = useMemo(() => {
    if (!product) return null;

    const safeLang = lang === "es" ? "es" : "en";
    const pick = (key: string) => product[`${key}_${safeLang}`] ?? "";

    return {
      name: pick("name"),
      description: pick("description"),
      longDescription: pick("long_description"),
      ingredients: pick("ingredients"),
      shelfLife: pick("shelf_life"),
      storage: pick("storage"),
      packaging: pick("packaging"),
      safeLang,
    };
  }, [product, lang]);

  const minQuantity = product?.min_order_quantity ?? 1;

  const handleAddToCart = () => {
    if (!product || !localized) return;

    const q = clampInt(quantity, minQuantity);

    addItem({
      productId: String(product.id),
      name: localized.name,
      price: product.price,
      quantity: q,
      unit: product.unit,
      imageUrl: product.image_url,
      min_order_quantity: minQuantity,
    });

    toast({
      title: lang === "es" ? "Añadido" : "Added",
      description: lang === "es" ? "Producto añadido al carrito." : "Added to cart.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto px-4 py-10">
          {/* Back */}
          <Link href="/products" className="inline-flex w-fit">
            <Button
              variant="ghost"
              size="sm"
              className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("product.back_to_products", lang)}
            </Button>
          </Link>

          {/* Loading / Error */}
          {loading && (
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="h-[420px] rounded-xl border bg-muted/20 animate-pulse" />
              <div className="space-y-4">
                <div className="h-10 w-2/3 rounded-lg bg-muted/20 animate-pulse" />
                <div className="h-5 w-1/2 rounded-lg bg-muted/20 animate-pulse" />
                <div className="h-14 w-1/3 rounded-lg bg-muted/20 animate-pulse" />
                <div className="h-10 w-full rounded-lg bg-muted/20 animate-pulse" />
              </div>
            </div>
          )}

          {!loading && error && (
            <Card className="border-destructive/30">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                {error}
              </CardContent>
            </Card>
          )}

          {!loading && !error && product && localized && (
            <>
              {/* Main */}
              <div className="grid lg:grid-cols-2 gap-8 mb-10">
                {/* Image */}
                <div className="relative h-[420px] lg:h-[520px] rounded-xl overflow-hidden border bg-card">
                  <Image
                    src={product.image_url}
                    alt={localized.name}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>

                {/* Details */}
                <div className="flex flex-col justify-between gap-6">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight mb-2">
                      {localized.name}
                    </h1>
                    <p className="text-muted-foreground mb-5">
                      {localized.description}
                    </p>

                    {isApproved ? (
                      <>
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-4xl font-semibold">
                            €{product.price}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            / {product.unit}
                          </span>
                        </div>

                        <Badge variant="secondary" className="mb-4">
                          {t("products.min_order", lang)}: {minQuantity}{" "}
                          {lang === "es" ? "unidades" : "pcs"}
                        </Badge>

                        {/* Quantity */}
                        <div className="mb-4 flex items-end gap-3">
                          <div className="flex flex-col gap-2">
                            <Label className="text-muted-foreground">
                              {t("cart.quantity", lang)}
                            </Label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={minQuantity}
                              value={quantity}
                              onChange={(e) =>
                                setQuantity(
                                  clampInt(Number(e.target.value), minQuantity)
                                )
                              }
                              className="w-28"
                              disabled={false}
                            />
                          </div>

                          <Button
                            onClick={() => setQuantity(minQuantity)}
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {lang === "es" ? "Mínimo" : "Min"}
                          </Button>
                        </div>

                        <Button onClick={handleAddToCart} className="w-full">
                          {t("products.add_to_cart", lang)}
                        </Button>
                      </>
                    ) : (
                      <Card className="border-muted">
                        <CardContent className="pt-6 flex gap-3 items-start">
                          <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <p className="text-sm text-muted-foreground">
                            {t("products.price_hidden", lang)}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>

              {/* Info cards */}
              <div className="grid md:grid-cols-2 gap-6">
                <InfoCard icon={List} title={t("product.description", lang)}>
                  {localized.longDescription}
                </InfoCard>

                <InfoCard icon={Package} title={t("product.ingredients", lang)}>
                  {localized.ingredients}
                </InfoCard>

                <InfoCard icon={Refrigerator} title={t("product.storage", lang)}>
                  {localized.storage}
                </InfoCard>

                <InfoCard icon={Clock} title={t("product.shelf_life", lang)}>
                  <div className="space-y-2">
                    <div>{localized.shelfLife}</div>
                    <div className="text-sm">
                      <span className="font-medium text-foreground">
                        {t("product.packaging", lang)}:
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {localized.packaging}
                      </span>
                    </div>
                  </div>
                </InfoCard>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground leading-relaxed">
        {children}
      </CardContent>
    </Card>
  );
}
