"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";
import { ArrowLeft } from "lucide-react";

type Lang = "en" | "es";
const L = (v: any): Lang => (v === "es" ? "es" : "en");

const copy: Record<Lang, any> = {
  en: {
    title: "Reset your password",
    desc: "Enter your email and we’ll send you a reset link.",
    email: "Email",
    send: "Send reset link",
    sending: "Sending...",
    sent: "If an account exists, we sent a reset link to your email.",
    back: "Back to login",
    back_short: "Back",
  },
  es: {
    title: "Restablecer contraseña",
    desc: "Ingresa tu correo y te enviaremos un enlace para restablecerla.",
    email: "Correo electrónico",
    send: "Enviar enlace",
    sending: "Enviando...",
    sent: "Si la cuenta existe, te enviamos un enlace de restablecimiento.",
    back: "Volver a iniciar sesión",
    back_short: "Volver",
  },
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const uiLang = L(lang);
  const t = copy[uiLang];

  const supabase = createSupabaseClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleBack = () => {
    if (loading) return;

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.replace("/login");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) console.error("resetPasswordForEmail error:", error);

      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-muted/40 to-background">
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-sm">
<CardHeader className="space-y-3">
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={handleBack}
    disabled={loading}
    className="gap-2 w-fit"
  >
    <ArrowLeft className="h-4 w-4" />
    {t.back}
  </Button>

  <div className="space-y-1">
    <CardTitle className="text-2xl">Reset your password</CardTitle>
    <CardDescription>
      Enter your email and we’ll send you a reset link.
    </CardDescription>
  </div>
</CardHeader>


<CardContent className="space-y-4">
  {sent ? (
    <div className="rounded-lg border bg-muted/40 p-4 text-sm">
      {t.sent}
    </div>
  ) : (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t.email}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          autoComplete="email"
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t.sending : t.send}
      </Button>
    </form>
  )}
</CardContent>

        </Card>
      </div>
    </div>
  );
}
