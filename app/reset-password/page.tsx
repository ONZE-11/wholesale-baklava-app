"use client";

import { useMemo, useState } from "react";
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

const copy: Record<Lang, any> = {
  en: {
    title: "Set a new password",
    desc: "Choose a new password for your account.",
    missingTitle: "Reset link required",
    missingDesc: "Please request a password reset link first.",
    goForgot: "Go to Forgot Password",
    password: "New password",
    confirm: "Confirm password",
    save: "Save password",
    saving: "Saving...",
    mismatch: "Passwords do not match.",
    noSession:
      "We couldn’t verify your reset session. Request a new link and open it in the same browser.",
    success: "Password updated. Redirecting to login...",
    backLogin: "Back to login",
    requestNew: "Request a new link",
  },
  es: {
    title: "Crear nueva contraseña",
    desc: "Elige una nueva contraseña para tu cuenta.",
    missingTitle: "Se requiere enlace",
    missingDesc: "Primero solicita un enlace para restablecer la contraseña.",
    goForgot: "Ir a 'Olvidé mi contraseña'",
    password: "Nueva contraseña",
    confirm: "Confirmar contraseña",
    save: "Guardar contraseña",
    saving: "Guardando...",
    mismatch: "Las contraseñas no coinciden.",
    noSession:
      "No pudimos verificar tu sesión. Solicita un enlace nuevo y ábrelo en el mismo navegador.",
    success: "Contraseña actualizada. Redirigiendo...",
    backLogin: "Volver a iniciar sesión",
    requestNew: "Solicitar un nuevo enlace",
  },
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const supabase = createSupabaseClient();
  const { lang } = useLanguage();

  const uiLang = useMemo(() => L(lang), [lang]);
  const t = copy[uiLang];

  const code = sp.get("code"); // اگر نباشه یعنی مستقیم اومده اینجا

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // ✅ اگر code نداریم، UX درست: راهنمایی به forgot-password
  if (!code) {
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            <Button className="w-full" disabled={loading}>
              {loading ? t.saving : t.save}
            </Button>
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
