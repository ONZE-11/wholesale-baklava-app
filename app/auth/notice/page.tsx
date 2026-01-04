"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/language-context";

type Lang = "en" | "es";

function normalizeLang(v: any): Lang {
  return v === "es" ? "es" : "en";
}

export default function AuthNoticePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const { lang: ctxLang } = useLanguage();

  // ✅ اولویت: lang از URL، اگر نبود از context، اگر اونم نبود en
  const lang: Lang = useMemo(() => {
    const q = sp.get("lang");
    if (q === "en" || q === "es") return q;
    return normalizeLang(ctxLang);
  }, [sp, ctxLang]);

  const msg = sp.get("msg") || "already_registered";
  const next = sp.get("next") || "/dashboard";

  // ✅ اگر next خودش query داشته باشه، درست اضافه کن
  const nextUrl = useMemo(() => {
    const hasQuery = next.includes("?");
    return `${next}${hasQuery ? "&" : "?"}lang=${lang}`;
  }, [next, lang]);

  const messages: Record<Lang, Record<string, string>> = {
    en: {
      already_registered: "You already registered. Showing your current status.",
      complete_profile: "Please complete your profile to continue.",
      welcome_sso: "Welcome! Please complete your business profile to proceed.",
      redirecting: "Redirecting...",
    },
    es: {
      already_registered: "Ya te habías registrado. Mostramos tu estado actual.",
      complete_profile: "Por favor completa tu perfil para continuar.",
      welcome_sso: "¡Bienvenido! Completa tu perfil de negocio para continuar.",
      redirecting: "Redirigiendo...",
    },
  };

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace(nextUrl);
    }, 4500); // ✅ مدت زمان نمایش (۴.۵ ثانیه)

    return () => clearTimeout(t);
  }, [router, nextUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
      <Card className="w-full max-w-xl border-2 border-blue-200 shadow-lg">
        <CardHeader className="bg-blue-50 border-b border-blue-200">
          <CardTitle className="text-blue-900">
            {messages[lang][msg] ?? messages[lang].already_registered}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-sm text-muted-foreground">
          {messages[lang].redirecting}
        </CardContent>
      </Card>
    </div>
  );
}
