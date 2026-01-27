"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Award,
  Heart,
  Leaf,
  Users,
  TrendingUp,
  Package,
  Globe,
  HeadphonesIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";
import { useAuthMe } from "@/lib/use-auth-me";

export default function AboutPage() {
  const { lang } = useLanguage();
  const { loading, isAuthenticated, approvalStatus } = useAuthMe();

  const CTAButton = () => {
    if (loading) {
      return (
        <p className="text-xl mb-10 text-primary-foreground/90">
          {lang === "es" ? "Cargando..." : "Loading..."}
        </p>
      );
    }

    if (!isAuthenticated) {
      return (
        <Link href={`/register`}>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-10 shadow-xl"
          >
            {t("auth.register.button", lang)}
          </Button>
        </Link>
      );
    }

    if (approvalStatus === "approved") {
      return (
        <Link href={`/products`}>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-10 shadow-xl"
          >
            {lang === "es" ? "Ver productos" : "View products"}
          </Button>
        </Link>
      );
    }

    return (
      <Link href={`/dashboard`}>
        <Button
          size="lg"
          variant="secondary"
          className="text-lg px-10 shadow-xl"
        >
          {lang === "es" ? "Ir al panel" : "Go to dashboard"}
        </Button>
      </Link>
    );
  };

  const CTAText = () => {
    if (loading) return "";

    if (!isAuthenticated) {
      return lang === "es"
        ? "Descubra por qué cientos de negocios confían en nosotros para su suministro de baklava premium."
        : "Discover why hundreds of businesses trust us for their premium baklava supply.";
    }

    if (approvalStatus === "approved") {
      return lang === "es"
        ? "Tu cuenta está aprobada. Ya puedes comprar al por mayor."
        : "Your account is approved. You can order wholesale now.";
    }

    if (approvalStatus === "request_docs") {
      return lang === "es"
        ? "Se solicitaron documentos. Revisa tu email y envíalos para continuar."
        : "Documents were requested. Check your email and upload them to continue.";
    }

    if (approvalStatus === "rejected") {
      return lang === "es"
        ? "Tu cuenta fue rechazada. Revisa tu email o contacta soporte."
        : "Your account was rejected. Check your email or contact support.";
    }

    return lang === "es"
      ? "Ya estás registrado. Tu cuenta está pendiente de aprobación."
      : "You’re registered. Your account is pending approval.";
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23b8860b' fillOpacity='0.4' fillRule='evenodd'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-bottom duration-700">
            <h1 className="text-5xl lg:text-7xl font-bold text-balance mb-6 text-foreground">
              {t("about.hero.title", lang)}
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground text-pretty leading-relaxed">
              {t("about.hero.subtitle", lang)}
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/premium-baklava-dessert-close-up-honey-golden.jpg"
                alt="Our Mission"
                fill
                className="object-cover"
              />
            </div>
            <div className="animate-in fade-in slide-in-from-right duration-700">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-balance">
                {t("about.mission.title", lang)}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {t("about.mission.text", lang)}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-1">
                    +20
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {lang === "es" ? "Años" : "Years"}
                  </div>
                </div>

                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-1">
                    +100
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {lang === "es" ? "Clientes" : "Clients"}
                  </div>
                </div>

                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-1">
                    +20
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {lang === "es" ? "Productos" : "Products"}
                  </div>
                </div>

                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-1">
                    +15
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {lang === "es" ? "Ciudades" : "Cities"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-balance">
              {t("about.values.title", lang)}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-2">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Award className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {t("about.values.quality", lang)}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t("about.values.quality.desc", lang)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-2">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent/60 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Heart className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {t("about.values.authenticity", lang)}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t("about.values.authenticity.desc", lang)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-2">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/60 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Users className="h-8 w-8 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {t("about.values.service", lang)}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t("about.values.service.desc", lang)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-2">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Leaf className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {t("about.values.sustainability", lang)}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t("about.values.sustainability.desc", lang)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-balance">
              {t("about.why.title", lang)}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">
                  {t("about.why.experience", lang)}
                </h3>
                <p className="text-muted-foreground">
                  {t("about.why.experience.desc", lang)}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">
                  {t("about.why.capacity", lang)}
                </h3>
                <p className="text-muted-foreground">
                  {t("about.why.capacity.desc", lang)}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">
                  {t("about.why.delivery", lang)}
                </h3>
                <p className="text-muted-foreground">
                  {t("about.why.delivery.desc", lang)}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <HeadphonesIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">
                  {t("about.why.support", lang)}
                </h3>
                <p className="text-muted-foreground">
                  {t("about.why.support.desc", lang)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ CTA Section Fix */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-balance text-primary-foreground">
              {lang === "es" ? "Únase a Nuestra Familia" : "Join Our Family"}
            </h2>
            <p className="text-xl mb-10 text-primary-foreground/90 max-w-2xl mx-auto text-pretty">
              {CTAText()}
            </p>

            <CTAButton />
          </div>
        </div>
      </section>
    </>
  );
}
