"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Award, Package, Truck, ChevronRight, Star, Shield } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/i18n";
import Image from "next/image";
import { useAuthMe } from "@/lib/use-auth-me";

export default function HomePage() {
  const { lang } = useLanguage();
  const { loading, isAuthenticated, approvalStatus } = useAuthMe();

  const CTA = () => {
    if (loading) {
      return (
        <p className="text-xl lg:text-2xl mb-10 text-primary-foreground/90">
          {lang === "es" ? "Cargando..." : "Loading..."}
        </p>
      );
    }

    if (!isAuthenticated) {
      return (
        <>
          <p className="text-xl lg:text-2xl mb-10 text-primary-foreground/90 max-w-2xl mx-auto text-pretty leading-relaxed">
            {lang === "es"
              ? "Regístrate hoy para acceder a nuestros precios al por mayor y comenzar a pedir."
              : "Register today to access our wholesale prices and start ordering premium baklava for your business."}
          </p>

          <Link href="/register">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-10 py-6 shadow-xl hover:scale-105 transition-transform"
            >
              {t("auth.register.button", lang)}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </>
      );
    }

    if (approvalStatus === "approved") {
      return (
        <>
          <p className="text-xl lg:text-2xl mb-10 text-primary-foreground/90 max-w-2xl mx-auto text-pretty leading-relaxed">
            {lang === "es"
              ? "Tu cuenta está aprobada. Ya puedes ver precios y comprar."
              : "Your account is approved. You can view prices and order now."}
          </p>

          <Link href="/products">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-10 py-6 shadow-xl hover:scale-105 transition-transform"
            >
              {lang === "es" ? "Ver productos" : "View products"}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </>
      );
    }

    if (approvalStatus === "request_docs") {
      return (
        <>
          <p className="text-xl lg:text-2xl mb-10 text-primary-foreground/90 max-w-2xl mx-auto text-pretty leading-relaxed">
            {lang === "es"
              ? "Se solicitaron documentos. Revisa tu email y envíalos para continuar."
              : "Documents were requested. Check your email and upload them to continue."}
          </p>

          <Link href="/dashboard">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-10 py-6 shadow-xl hover:scale-105 transition-transform"
            >
              {lang === "es" ? "Ir al panel" : "Go to dashboard"}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </>
      );
    }

    if (approvalStatus === "rejected") {
      return (
        <>
          <p className="text-xl lg:text-2xl mb-10 text-primary-foreground/90 max-w-2xl mx-auto text-pretty leading-relaxed">
            {lang === "es"
              ? "Tu cuenta fue rechazada. Revisa tu email o contacta soporte."
              : "Your account was rejected. Check your email or contact support."}
          </p>

          <Link href="/dashboard">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-10 py-6 shadow-xl hover:scale-105 transition-transform"
            >
              {lang === "es" ? "Ir al panel" : "Go to dashboard"}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </>
      );
    }

    // pending یا هر وضعیت دیگر
    return (
      <>
        <p className="text-xl lg:text-2xl mb-10 text-primary-foreground/90 max-w-2xl mx-auto text-pretty leading-relaxed">
          {lang === "es"
            ? "Ya estás registrado. Tu cuenta está pendiente de aprobación."
            : "You’re registered. Your account is pending approval."}
        </p>

        <Link href="/dashboard">
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-10 py-6 shadow-xl hover:scale-105 transition-transform"
          >
            {lang === "es" ? "Ir al panel" : "Go to dashboard"}
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23b8860b' fillOpacity='0.4' fillRule='evenodd'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-accent/10 rounded-full blur-2xl animate-float-delayed" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-secondary/10 rounded-full blur-3xl animate-float animation-delay-300" />
        <div className="absolute bottom-40 left-32 w-36 h-36 bg-primary/5 rounded-full blur-3xl animate-float-delayed animation-delay-700" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-in fade-in slide-in-from-left duration-700">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground font-medium">
                  {lang === "es" ? "Calidad Premium Garantizada" : "Premium Quality Guaranteed"}
                </span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold text-balance mb-6 text-foreground leading-tight">
                {t("home.hero.title", lang)}
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground mb-8 text-pretty leading-relaxed">
                {t("home.hero.subtitle", lang)}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={`/products`}>
                  <Button size="lg" className="text-lg px-8 group">
                    {t("home.hero.cta", lang)}
                    <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                    {lang === "es" ? "Conócenos" : "Learn More"}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative h-[400px] lg:h-[550px] animate-in fade-in slide-in-from-right duration-700 delay-200">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-2xl transform rotate-3" />
              <div className="relative h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-background">
                <Image
                  src="/premium-baklava-dessert-close-up-honey-golden.jpg"
                  alt="Premium Baklava"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                  priority
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground px-6 py-4 rounded-xl shadow-xl animate-bounce">
                <div className="text-3xl font-bold">20+</div>
                <div className="text-sm">{lang === "es" ? "Años de Experiencia" : "Years Experience"}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom duration-700">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-balance">
              {lang === "es" ? "¿Por Qué Elegirnos?" : "Why Choose Us?"}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              {lang === "es"
                ? "Comprometidos con la excelencia en cada aspecto de nuestro servicio"
                : "Committed to excellence in every aspect of our service"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group">
              <CardContent className="pt-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Award className="h-10 w-10 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{t("home.features.quality", lang)}</h3>
                <p className="text-muted-foreground leading-relaxed">{t("home.features.quality.desc", lang)}</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group">
              <CardContent className="pt-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-secondary to-secondary/60 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Shield className="h-10 w-10 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{t("home.features.certification", lang)}</h3>
                <p className="text-muted-foreground leading-relaxed">{t("home.features.certification.desc", lang)}</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group">
              <CardContent className="pt-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-accent to-accent/60 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Truck className="h-10 w-10 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{t("home.features.delivery", lang)}</h3>
                <p className="text-muted-foreground leading-relaxed">{t("home.features.delivery.desc", lang)}</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group">
              <CardContent className="pt-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/80 to-accent/80 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Package className="h-10 w-10 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{t("home.features.wholesale", lang)}</h3>
                <p className="text-muted-foreground leading-relaxed">{t("home.features.wholesale.desc", lang)}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ✅ CTA Section Fix */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzR2LTRoLTJ2NGgtNHYyaDR2NGgydi00aDR2LTJoLTR6bTAtMzBWMGgtMnY0aC00djJoNHY0aDJWNmg0VjRoLTR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0ySDZ6TTYgNFYwSDR2NEgwdjJoNHY0aDJWNmg0VjRINnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto animate-in fade-in zoom-in duration-700">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-balance text-primary-foreground">
              {lang === "es" ? "¿Listo para empezar?" : "Ready to get started?"}
            </h2>

            <CTA />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
