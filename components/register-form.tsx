"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/language-context";
import { ArrowLeft } from "lucide-react";

interface FormData {
  email: string;
  password: string;
  businessName: string;
  cif: string;
  taxId: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

// ✅ Regex ها
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// حروف/عدد/فاصله/خط تیره - طول 3 تا 16
const postalRegex = /^[A-Za-z0-9][A-Za-z0-9\s-]{2,15}$/;
// فقط عدد - طول 9 تا 15 (E.164-ish بدون +)
const phoneRegex = /^\d{9,15}$/;

function normalizeEmail(v: string) {
  return v.trim().toLowerCase();
}

function onlyDigits(v: string) {
  return v.replace(/[^\d]/g, "");
}

function safeText(v: string) {
  return v.replace(/\s+/g, " ").trim();
}

// ✅ Postal Code: اجازه حروف + عدد + فاصله + خط تیره
function normalizePostalCode(v: string) {
  return v
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidPostalCode(v: string) {
  const s = normalizePostalCode(v);
  if (s.length < 3 || s.length > 16) return false;
  return postalRegex.test(s);
}

export function RegisterForm() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const { lang } = useLanguage();

  const translations = useMemo(
    () => ({
      en: {
        register: "Register",
        enter_details: "Enter your details to create an account",
        email: "Email",
        password: "Password",
        business_name: "Business Name",
        cif: "CIF",
        tax_id: "Tax ID",
        phone: "Phone",
        address: "Address",
        city: "City",
        postal_code: "Postal Code",
        country: "Country",
        registering: "Registering...",
        register_with_email: "Register with Email",
        or_continue_with: "Or continue with",
        redirecting: "Redirecting...",
        register_with_google: "Continue with Google",
        back: "Back",
        invalid_email: "Please enter a valid email",
        weak_password: "Password must be at least 8 characters",
        invalid_phone: "Phone must be 9 to 15 digits",
        invalid_postal: "Please enter a valid postal code",
        required: "This field is required",
        email_taken: "This email is already registered",
      },
      es: {
        register: "Registrarse",
        enter_details: "Ingrese sus datos para crear una cuenta",
        email: "Correo electrónico",
        password: "Contraseña",
        business_name: "Nombre del negocio",
        cif: "CIF",
        tax_id: "ID fiscal",
        phone: "Teléfono",
        address: "Dirección",
        city: "Ciudad",
        postal_code: "Código postal",
        country: "País",
        registering: "Registrando...",
        register_with_email: "Registrarse con correo",
        or_continue_with: "O continuar con",
        redirecting: "Redirigiendo...",
        register_with_google: "Continuar con Google",
        back: "Volver",
        invalid_email: "Ingrese un correo válido",
        weak_password: "La contraseña debe tener al menos 8 caracteres",
        invalid_phone: "El teléfono debe tener 9 a 15 dígitos",
        invalid_postal: "Ingrese un código postal válido",
        required: "Campo obligatorio",
        email_taken: "Este correo ya está registrado",
      },
    }),
    []
  );

  const t = (key: keyof (typeof translations)["en"]) => {
    const current =
      translations[lang as keyof typeof translations] || translations.en;
    return current[key];
  };

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    businessName: "",
    cif: "",
    taxId: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const setField = <K extends keyof FormData>(key: K, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (data: FormData): FormErrors => {
    const e: FormErrors = {};

    const email = normalizeEmail(data.email);
    if (!email) e.email = t("required");
    else if (!emailRegex.test(email)) e.email = t("invalid_email");

    if (!data.password) e.password = t("required");
    else if (data.password.length < 8) e.password = t("weak_password");

    if (!safeText(data.businessName)) e.businessName = t("required");
    if (!safeText(data.cif)) e.cif = t("required");
    if (!safeText(data.phone)) e.phone = t("required");
    if (!safeText(data.address)) e.address = t("required");
    if (!safeText(data.city)) e.city = t("required");
    if (!safeText(data.postalCode)) e.postalCode = t("required");
    if (!safeText(data.country)) e.country = t("required");

    const phone = onlyDigits(data.phone);
    if (phone && !phoneRegex.test(phone)) e.phone = t("invalid_phone");

    if (data.postalCode && !isValidPostalCode(data.postalCode)) {
      e.postalCode = t("invalid_postal");
    }

    return e;
  };

  const handleBack = () => {
    if (isLoading) return;
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.replace("/login");
  };

  // ✅ بررسی وجود ایمیل (RPC) - اگر RPC نباشد، نرم fail می‌کنیم
  const checkEmailExists = async (email: string) => {
    const { data, error } = await supabase.rpc("email_exists", {
      p_email: email,
    });
    if (error) {
      console.warn("email_exists rpc error:", error.message);
      return false;
    }
    return Boolean(data);
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const cleaned: FormData = {
      ...formData,
      email: normalizeEmail(formData.email),
      businessName: safeText(formData.businessName),
      cif: safeText(formData.cif).toUpperCase(),
      taxId: safeText(formData.taxId).toUpperCase(),
      phone: onlyDigits(formData.phone),
      address: safeText(formData.address),
      city: safeText(formData.city),
      postalCode: normalizePostalCode(formData.postalCode),
      country: safeText(formData.country),
    };

    const v = validate(cleaned);
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }

    setIsLoading(true);

    try {
      // optional: چک ایمیل تکراری
      const exists = await checkEmailExists(cleaned.email);
      if (exists) {
        setErrors((prev) => ({ ...prev, email: t("email_taken") }));
        setIsLoading(false);
        return;
      }

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: cleaned.email,
          password: cleaned.password,
          options: {
            data: {
              business_name: cleaned.businessName,
              cif: cleaned.cif,
              tax_id: cleaned.taxId || null,
              phone: cleaned.phone || null,
              address: cleaned.address || null,
              city: cleaned.city || null,
              postal_code: cleaned.postalCode || null,
              country: cleaned.country || null,
            },
          },
        });

      if (signUpError) {
        const msg = (signUpError.message || "").toLowerCase();
        if (msg.includes("already") || msg.includes("registered")) {
          const lng = lang === "es" ? "es" : "en";
          router.replace(
            `/auth/notice?lang=${lng}&msg=already_registered&next=/login`
          );
          return;
        }
        throw signUpError;
      }

      const identities = signUpData?.user?.identities ?? [];
      if (
        signUpData?.user &&
        Array.isArray(identities) &&
        identities.length === 0
      ) {
        const lng = lang === "es" ? "es" : "en";
        router.replace(
          `/auth/notice?lang=${lng}&msg=already_registered&next=/login`
        );
        return;
      }

      if (!signUpData.session) {
        router.replace("/check-email");
        return;
      }

      router.replace("/dashboard");
    } catch (error: any) {
      console.error("EMAIL SIGNUP ERROR:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      const lng = lang === "es" ? "es" : "en";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?lang=${lng}`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("GOOGLE OAUTH ERROR:", error);
      setIsLoading(false);
    }
  };

  const FieldError = ({ name }: { name: keyof FormData }) =>
    errors[name] ? (
      <p className="text-sm text-destructive">{errors[name]}</p>
    ) : null;

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-muted/40 to-background">
      <div className="container mx-auto flex justify-center items-center min-h-screen px-4 py-10">
        <Card className="w-full max-w-2xl shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={isLoading}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("back")}
              </Button>
            </div>

            <div className="space-y-1">
              <CardTitle className="text-2xl">{t("register")}</CardTitle>
              <CardDescription>{t("enter_details")}</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleEmailSignUp} className="space-y-5" noValidate>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setField("email", e.target.value)}
                    onBlur={() =>
                      setField("email", normalizeEmail(formData.email))
                    }
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                  <FieldError name="email" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("password")} *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setField("password", e.target.value)}
                    required
                    minLength={8}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <FieldError name="password" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">{t("business_name")} *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setField("businessName", e.target.value)}
                  onBlur={() =>
                    setField("businessName", safeText(formData.businessName))
                  }
                  required
                  disabled={isLoading}
                  autoComplete="organization"
                />
                <FieldError name="businessName" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cif">{t("cif")} *</Label>
                  <Input
                    id="cif"
                    value={formData.cif}
                    onChange={(e) =>
                      setField("cif", e.target.value.toUpperCase())
                    }
                    required
                    disabled={isLoading}
                  />
                  <FieldError name="cif" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">{t("tax_id")}</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) =>
                      setField("taxId", e.target.value.toUpperCase())
                    }
                    disabled={isLoading}
                  />
                  <FieldError name="taxId" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("phone")} *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setField("phone", onlyDigits(e.target.value))}
                  required
                  disabled={isLoading}
                  autoComplete="tel"
                  inputMode="numeric"
                  pattern={phoneRegex.source}
                  placeholder="e.g. 34600111222"
                />
                <FieldError name="phone" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t("address")} *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setField("address", e.target.value)}
                  onBlur={() => setField("address", safeText(formData.address))}
                  required
                  disabled={isLoading}
                  autoComplete="street-address"
                />
                <FieldError name="address" />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">{t("city")} *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setField("city", e.target.value)}
                    onBlur={() => setField("city", safeText(formData.city))}
                    required
                    disabled={isLoading}
                    autoComplete="address-level2"
                  />
                  <FieldError name="city" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">{t("postal_code")} *</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) =>
                      setField(
                        "postalCode",
                        normalizePostalCode(e.target.value)
                      )
                    }
                    onBlur={() =>
                      setField(
                        "postalCode",
                        normalizePostalCode(formData.postalCode)
                      )
                    }
                    required
                    disabled={isLoading}
                    autoComplete="postal-code"
                    inputMode="text"
                    pattern={postalRegex.source}
                    placeholder="e.g. M5V 3L9"
                  />
                  <FieldError name="postalCode" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">{t("country")} *</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setField("country", e.target.value)}
                    onBlur={() =>
                      setField("country", safeText(formData.country))
                    }
                    required
                    disabled={isLoading}
                    autoComplete="country-name"
                  />
                  <FieldError name="country" />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("registering") : t("register_with_email")}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t("or_continue_with")}
                </span>
              </div>
            </div>

            <Button
              onClick={handleGoogleSignUp}
              variant="outline"
              className="w-full bg-transparent"
              disabled={isLoading}
            >
              {isLoading ? t("redirecting") : t("register_with_google")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
