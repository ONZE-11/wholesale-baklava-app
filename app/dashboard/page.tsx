"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";
import { useRouter, useSearchParams } from "next/navigation";

type Lang = "en" | "es";

function normalizeLang(v: any): Lang {
  return v === "es" ? "es" : "en";
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLanguage();

  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ زبان اصلی UI
  const uiLang: Lang = normalizeLang(lang);

  // ✅ زبان پیام‌های transient از URL (اگر نبود از UI lang استفاده کن)
  const msgLang: Lang = useMemo(() => {
    const q = searchParams.get("lang");
    return q === "en" || q === "es" ? q : uiLang;
  }, [searchParams, uiLang]);

  const translations: Record<Lang, Record<string, string>> = {
    en: {
      welcome: "Welcome",
      account_approved: "Your account is approved and fully active.",
      account_pending: "Your account is pending approval.",
      account_status: "Account Status",
      approved: "Approved",
      pending_review: "Pending Review",
      approved_text:
        "✅ Your account has been approved. You now have full access to the platform.",
      pending_text1: "⏳ Your account is currently under review.",
      pending_text2:
        "📧 An email will be sent to you with instructions for submitting the required documents.",
      pending_text3:
        "Once your documents are reviewed, you will be notified of the final approval status.",
      profile_info: "Your Profile Information",
      email: "Email",
      business_name: "Business Name",
      cif: "CIF",
      tax_id: "Tax ID",
      phone: "Phone",
      address: "Address",
      postal_city: "Postal Code & City",
      country: "Country",
      back_home: "Back to Home",

      // پیام‌های banner
      already_registered: "You already registered. Showing your current status.",
      profile_completed: "Your profile information was saved successfully.",
      complete_profile: "Please complete your profile to continue.",
      welcome_sso: "Welcome! Please complete your business profile to proceed.",
    },
    es: {
      welcome: "Bienvenido",
      account_approved: "Su cuenta está aprobada y completamente activa.",
      account_pending: "Su cuenta está pendiente de aprobación.",
      account_status: "Estado de la cuenta",
      approved: "Aprobado",
      pending_review: "En revisión",
      approved_text:
        "✅ Su cuenta ha sido aprobada. Ahora tiene acceso completo a la plataforma.",
      pending_text1: "⏳ Su cuenta está actualmente en revisión.",
      pending_text2:
        "📧 Se le enviará un correo con instrucciones para enviar los documentos requeridos.",
      pending_text3:
        "Una vez revisados sus documentos, se le notificará el estado final de aprobación.",
      profile_info: "Información de su perfil",
      email: "Correo electrónico",
      business_name: "Nombre del negocio",
      cif: "CIF",
      tax_id: "ID fiscal",
      phone: "Teléfono",
      address: "Dirección",
      postal_city: "Código postal y ciudad",
      country: "País",
      back_home: "Volver al inicio",

      // پیام‌های banner
      already_registered: "Ya te habías registrado. Mostramos tu estado actual.",
      profile_completed: "Tu información se guardó correctamente.",
      complete_profile: "Por favor completa tu perfil para continuar.",
      welcome_sso: "¡Bienvenido! Completa tu perfil de negocio para continuar.",
    },
  };

  const tUI = (key: string) => translations[uiLang]?.[key] ?? key;
  const tMsg = (key: string) => translations[msgLang]?.[key] ?? key;

  // ✅ فقط UI Banner (بدون alert/toast)
  const msg = searchParams.get("msg");
  const bannerText = msg ? tMsg(msg) : null;

  // ✅ گرفتن پروفایل
  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setIsLoading(true);

      const supabase = createSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .single();

      if (!mounted) return;

      if (profileError) {
        console.error("Failed to fetch profile", profileError);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setProfile(profileData);

      // ✅ اگر SSO است و اطلاعات ناقص است، به صفحه تکمیل اطلاعات برو
      if (
        profileData?.is_sso_user &&
        (!profileData.business_name ||
          !profileData.cif ||
          !profileData.phone ||
          !profileData.address ||
          !profileData.city ||
          !profileData.country)
      ) {
        router.replace(`/register-info?lang=${uiLang}&msg=complete_profile`);
        return;
      }

      setIsLoading(false);
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [router, uiLang]);

  if (isLoading) return <div className="p-8">Loading...</div>;

  if (!profile) {
    return (
      <div className="p-8 text-red-600">
        Unable to load your profile at this time.
      </div>
    );
  }

  const isApproved = profile.approval_status === "approved";

  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* ✅ Banner UI */}
      {bannerText && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {bannerText}
        </div>
      )}

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-green-600">
          {tUI("welcome")}, {profile.email} 🎉
        </h1>
        <p className="text-muted-foreground">
          {isApproved ? tUI("account_approved") : tUI("account_pending")}
        </p>
      </div>

      <Card
        className={
          isApproved
            ? "border-green-200 bg-green-50"
            : "border-yellow-200 bg-yellow-50"
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {tUI("account_status")}
            {isApproved ? (
              <Badge className="bg-green-600 text-white">{tUI("approved")}</Badge>
            ) : (
              <Badge className="bg-yellow-500 text-white">
                {tUI("pending_review")}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {isApproved ? (
            <p>{tUI("approved_text")}</p>
          ) : (
            <>
              <p>{tUI("pending_text1")}</p>
              <p>{tUI("pending_text2")}</p>
              <p className="text-muted-foreground">{tUI("pending_text3")}</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tUI("profile_info")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>
            <strong>{tUI("email")}:</strong> {profile.email}
          </p>
          <p>
            <strong>{tUI("business_name")}:</strong> {profile.business_name}
          </p>
          <p>
            <strong>{tUI("cif")}:</strong> {profile.cif}
          </p>
          <p>
            <strong>{tUI("tax_id")}:</strong> {profile.tax_id || "-"}
          </p>
          <p>
            <strong>{tUI("phone")}:</strong> {profile.phone}
          </p>
          <p>
            <strong>{tUI("address")}:</strong> {profile.address}
          </p>
          <p>
            <strong>{tUI("postal_city")}:</strong> {profile.postal_code || "-"}{" "}
            {profile.city}
          </p>
          <p>
            <strong>{tUI("country")}:</strong> {profile.country}
          </p>
        </CardContent>
      </Card>

      <Link href="/">
        <Button className="mt-4">{tUI("back_home")}</Button>
      </Link>
    </div>
  );
}
