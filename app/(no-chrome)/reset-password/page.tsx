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
  redirecting: string;

  requestNew: string;
  saving: string;
  save: string;

  verifying: string;
};

const copy: Record<Lang, CopyShape> = {
  en: {
    noSession:
      "We couldn’t verify your reset session. Request a new link and open it in the same browser.",
    missingTitle: "Reset link missing",
    missingDesc: "No reset token found. Please request a new password reset.",
    goForgot: "Request password reset",
    backLogin: "Back to login",

    title: "Set a new password",
    desc: "Enter your new password below.",
    password: "New password",
    confirm: "Confirm password",

    mismatch: "Passwords do not match.",
    success: "Password updated successfully!",
    redirecting: "Redirecting to login…",

    requestNew: "Request new link",
    saving: "Saving...",
    save: "Save password",

    verifying: "Verifying link…",
  },
  es: {
    noSession:
      "No pudimos verificar tu sesión. Solicita un enlace nuevo y ábrelo en el mismo navegador.",
    missingTitle: "Falta el enlace",
    missingDesc:
      "No se encontró el token. Solicita un nuevo enlace para establecer/restablecer contraseña.",
    goForgot: "Solicitar enlace",
    backLogin: "Volver a iniciar sesión",

    title: "Crear nueva contraseña",
    desc: "Ingresa tu nueva contraseña a continuación.",
    password: "Nueva contraseña",
    confirm: "Confirmar contraseña",

    mismatch: "Las contraseñas no coinciden.",
    success: "¡Contraseña actualizada con éxito!",
    redirecting: "Redirigiendo al inicio de sesión…",

    requestNew: "Solicitar nuevo enlace",
    saving: "Guardando...",
    save: "Guardar contraseña",

    verifying: "Verificando enlace…",
  },
};

function parseHashParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  const hash = window.location.hash?.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash || "";
  return new URLSearchParams(hash);
}

function normalizeOtpType(v: string | null): "recovery" | "invite" | null {
  if (!v) return null;
  const x = v.toLowerCase();
  if (x === "recovery") return "recovery";
  if (x === "invite") return "invite";
  return null;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const { lang } = useLanguage();

  const uiLang = useMemo(() => L(lang), [lang]);
  const t = copy[uiLang];

  const supabase = useMemo(() => createSupabaseClient(), []);

  // query params
  const code = sp.get("code"); // PKCE
  const token = sp.get("token"); // verify link (admin generateLink)
  const queryType = normalizeOtpType(sp.get("type")); // invite یا recovery

  // hash params (implicit)
  const [hashHint, setHashHint] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [ready, setReady] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // فقط برای اینکه SSR گیر نده و hasAnyHint دقیق باشه
    if (typeof window !== "undefined") {
      setHashHint(!!window.location.hash);
    }
  }, []);

  const hasAnyHint = !!code || (!!token && !!queryType) || hashHint;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!hasAnyHint) return;

      setMsg(null);
      setReady(false);
      setVerifying(true);

      try {
        // 0) اگر از قبل session داریم، آماده‌ایم
        const { data: s0 } = await supabase.auth.getSession();
        if (cancelled) return;
        if (s0.session) {
          setReady(true);
          return;
        }

        // 1) PKCE code flow
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (cancelled) return;

          if (error) {
            console.error("exchangeCodeForSession error:", error);
            setMsg(error.message || t.noSession);
            return;
          }

          const { data: s1 } = await supabase.auth.getSession();
          if (cancelled) return;

          if (s1.session) setReady(true);
          else setMsg(t.noSession);
          return;
        }

        // 2) token+type flow (auth/v1/verify?token=...&type=...)
        if (token && queryType) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token, // ✅ token در URL همون token_hash محسوب میشه
            type: queryType,
          });

          if (cancelled) return;

          if (error) {
            console.error("verifyOtp error:", error);
            setMsg(error.message || t.noSession);
            return;
          }

          const { data: s2 } = await supabase.auth.getSession();
          if (cancelled) return;

          if (s2.session) setReady(true);
          else setMsg(t.noSession);
          return;
        }

        // 3) hash-based tokens (مثل چیزی که تو لاگت هست)
        const hp = parseHashParams();
        const access_token = hp.get("access_token");
        const refresh_token = hp.get("refresh_token");
        const hashType = normalizeOtpType(hp.get("type"));

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (cancelled) return;

          if (error) {
            console.error("setSession error:", error);
            setMsg(error.message || t.noSession);
            return;
          }

          // تمیزکاری hash (خیلی مهم: reuse و گیجی کم میشه)
          try {
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname + window.location.search
            );
          } catch {}

          setReady(true);
          return;
        }

        setMsg(t.noSession);
      } finally {
        if (!cancelled) setVerifying(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasAnyHint, code, token, queryType, supabase, t.noSession]);

  if (!hasAnyHint) {
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

    const { data: s } = await supabase.auth.getSession();
    if (!s.session) {
      setMsg(t.noSession);
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error("updateUser error:", error);
      setMsg(error.message || t.noSession);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setMsg(`${t.success} ${t.redirecting}`);

    await supabase.auth.signOut();
    setTimeout(() => router.replace("/login?reset=success"), 1200);
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
            <div
              className={`rounded-lg border p-3 text-sm ${
                success
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-muted/40"
              }`}
            >
              {msg}

              {!success && (
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
                disabled={loading || success}
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
                disabled={loading || success}
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || success || !ready}
              title={!ready ? t.noSession : ""}
            >
              {loading ? t.saving : t.save}
            </Button>

            {verifying && !msg && (
              <p className="text-xs text-muted-foreground">{t.verifying}</p>
            )}

            {!verifying && !ready && !msg && (
              <p className="text-xs text-muted-foreground">{t.noSession}</p>
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
