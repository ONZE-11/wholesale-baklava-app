"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { t } from "@/lib/i18n";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/language-context";

type Lang = "en" | "es";
const L = (v: any): Lang => (v === "es" ? "es" : "en");

function getAdminEmails() {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function mapAuthErrorToUserMessage(message: string, lang: Lang) {
  const m = (message || "").toLowerCase();

  // رایج‌ترین حالت شما
  if (m.includes("invalid login credentials")) {
    return lang === "es"
      ? "Correo o contraseña incorrectos."
      : "Wrong email or password.";
  }

  if (m.includes("email not confirmed")) {
    return lang === "es"
      ? "Tu correo aún no está confirmado. Revisa tu email y confirma la cuenta."
      : "Your email is not confirmed yet. Check your inbox and confirm your account.";
  }

  if (m.includes("user not found")) {
    return lang === "es"
      ? "No encontramos una cuenta con este correo."
      : "We couldn't find an account with this email.";
  }

  // fallback: پیام خود supabase
  return message || (lang === "es" ? "Error al iniciar sesión." : "Login failed.");
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLanguage();
  const uiLang = useMemo(() => L(lang), [lang]);

  const supabase = useMemo(() => createSupabaseClient(), []);

  const redirectParam = searchParams.get("redirect") || "";
  const nextPath = redirectParam.trim() ? redirectParam : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ✅ اگر session هست، برگردون به مقصد
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const session = data.session;
      if (!session) return;

      const adminEmails = getAdminEmails();
      const sessionEmail = session.user?.email || "";
      const isAdmin = sessionEmail ? adminEmails.includes(sessionEmail) : false;

      if (redirectParam) {
        router.replace(redirectParam);
      } else if (isAdmin) {
        router.replace(`/admin?lang=${uiLang}`);
      } else {
        router.replace(`/?lang=${uiLang}`);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router, supabase, redirectParam, uiLang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error || !data.session) {
        const msg = mapAuthErrorToUserMessage(error?.message || "", uiLang);
        setErrorMsg(msg);
        return;
      }

      setSuccessMsg(
        uiLang === "es"
          ? "Inicio de sesión correcto. Redirigiendo..."
          : "Login successful. Redirecting..."
      );

      const adminEmails = getAdminEmails();
      const sessionEmail = data.session.user?.email || "";
      const isAdmin = sessionEmail ? adminEmails.includes(sessionEmail) : false;

      if (redirectParam) {
        router.replace(redirectParam);
      } else if (isAdmin) {
        router.replace(`/admin?lang=${uiLang}`);
      } else {
        router.replace(`/?lang=${uiLang}`);
      }
    } catch (err: any) {
      console.error("[Login exception]", err);
      setErrorMsg(
        uiLang === "es"
          ? "Ocurrió un error. Intenta de nuevo."
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // ✅ گوگل باید به callback سرور شما برود
      const redirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(
        nextPath
      )}&lang=${encodeURIComponent(uiLang)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        setErrorMsg(mapAuthErrorToUserMessage(error.message, uiLang));
        setIsLoading(false);
      }
      // موفقیت = redirect
    } catch (err: any) {
      console.error("[Google sign-in error]", err);
      setErrorMsg(
        uiLang === "es"
          ? "Error con Google. Intenta de nuevo."
          : "Google sign-in failed. Please try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Back */}
    <Link href="/" className="w-fit">
  <Button
    variant="ghost"
    size="sm"
    className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
  >
    <ArrowLeft className="h-4 w-4" />
    {t("nav.home", uiLang)}
  </Button>
</Link>


      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t("auth.login.title", uiLang)}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* ✅ UI messages */}
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {successMsg}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full bg-transparent"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {t("google_signin", uiLang)}
          </Button>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              {t("auth.or", uiLang)}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email", uiLang)}</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password", uiLang)}</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("auth.loading", uiLang) : t("auth.login.button", uiLang)}
            </Button>

            <div className="flex flex-col gap-2">
              <p className="text-center text-sm text-muted-foreground">
                {t("auth.no_account", uiLang)}{" "}
                <Link href="/register" className="text-primary hover:underline">
                  {t("auth.register.button", uiLang)}
                </Link>
              </p>

              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:underline text-center"
              >
                {uiLang === "es" ? "¿Olvidaste tu contraseña?" : "Forgot your password?"}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
