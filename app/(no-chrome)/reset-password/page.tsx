"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Lang = "en" | "es";
const L = (v: any): Lang => (v === "es" ? "es" : "en");

type CopyShape = {
  noSession: string;
  missingTitle: string;
  missingDesc: string;
  goForgot: string;
  backLogin: string;

  title: string;
  desc: string;
  password: string;
  confirm: string;

  mismatch: string;
  success: string;

  requestNew: string;
  saving: string;
  save: string;

  verifying: string;
};

const copy: Record<Lang, CopyShape> = {
  en: {
    noSession: "Invalid or expired reset link.",
    missingTitle: "Reset link missing",
    missingDesc: "No reset token found. Please request a new password reset.",
    goForgot: "Request password reset",
    backLogin: "Back to login",

    title: "Reset your password",
    desc: "Enter your new password below.",
    password: "New password",
    confirm: "Confirm password",

    mismatch: "Passwords do not match.",
    success: "Password reset successfully! Redirecting to login...",

    requestNew: "Request new link",
    saving: "Saving...",
    save: "Reset password",

    verifying: "Verifying reset link...",
  },
  es: {
    noSession: "Enlace de restablecimiento inválido o expirado.",
    missingTitle: "Falta el enlace de restablecimiento",
    missingDesc:
      "No se encontró el token de restablecimiento. Solicita un nuevo enlace.",
    goForgot: "Solicitar restablecimiento",
    backLogin: "Volver a iniciar sesión",

    title: "Restablecer contraseña",
    desc: "Ingresa tu nueva contraseña a continuación.",
    password: "Nueva contraseña",
    confirm: "Confirmar contraseña",

    mismatch: "Las contraseñas no coinciden.",
    success: "¡Contraseña restablecida! Redirigiendo a inicio de sesión...",

    requestNew: "Solicitar nuevo enlace",
    saving: "Guardando...",
    save: "Restablecer contraseña",

    verifying: "Verificando enlace...",
  },
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const supabase = createSupabaseClient();
  const { lang } = useLanguage();

  const uiLang = useMemo(() => L(lang), [lang]);
  const t = copy[uiLang];

  // ✅ Supabase ممکنه code یا token_hash بده (بسته به نوع لینک/نسخه/تنظیمات)
  const token = sp.get("code") ?? sp.get("token_hash");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // ready یعنی session ریکاوری ساخته شده و updateUser معنی دارد
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    (async () => {
      setMsg(null);
      setReady(false);

      // ✅ کلیدی: ساختن session از روی توکن
      const { error } = await supabase.auth.exchangeCodeForSession(token);

      if (cancelled) return;

      if (error) {
        console.error("exchangeCodeForSession error:", error);
        setMsg(t.noSession);
        setReady(false);
        return;
      }

      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, supabase, uiLang]); // uiLang برای اینکه متن error به زبان درست آپدیت شود

  // ✅ اگر هیچ توکنی نیست، یعنی مستقیم اومده این صفحه
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>{t.missingTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">{t.missingDesc}</p>

            <Link href="/forgot-password">
              <Button className="w-full">{t.goForgot}</Button>
            </Link>

            <Link href="/login">
              <Button variant="outline" className="w-full">
                {t.backLogin}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ready) {
      setMsg(t.noSession);
      return;
    }

    if (password !== confirm) {
      setMsg(t.mismatch);
      return;
    }

    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error("updateUser error:", error);
      setMsg(t.noSession);
      setLoading(false);
      return;
    }

    // ✅ تمیزکاری: session ریکاوری رو نگه ندار
    await supabase.auth.signOut();

    setMsg(t.success);
    setTimeout(() => router.replace("/login"), 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.desc}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {msg && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              {msg}

              {msg === t.noSession && (
                <div className="mt-3 flex gap-2">
                  <Link href="/forgot-password" className="flex-1">
                    <Button variant="outline" className="w-full">
                      {t.requestNew}
                    </Button>
                  </Link>
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" className="w-full">
                      {t.backLogin}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t.password}</Label>
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || !ready}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label>{t.confirm}</Label>
              <Input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={loading || !ready}
                autoComplete="new-password"
              />
            </div>

            <Button className="w-full" disabled={loading || !ready}>
              {loading ? t.saving : t.save}
            </Button>

            {/* ✅ فقط وقتی هنوز پیام نداریم و آماده نیستیم */}
            {!ready && !msg && (
              <p className="text-xs text-muted-foreground">{t.verifying}</p>
            )}
          </form>

          <Link href="/login">
            <Button variant="outline" className="w-full">
              {t.backLogin}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
