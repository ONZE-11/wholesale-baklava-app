"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/language-context";

function cleanPayload<T extends Record<string, any>>(obj: T) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    out[k] = v;
  }
  return out;
}

export default function RegisterInfoPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const { toast } = useToast();
  const { lang } = useLanguage();
  const supabase = useMemo(() => createSupabaseClient(), []);

  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    business_name: "",
    cif: "",
    tax_id: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    country: "",
  });

  const translations = {
    en: {
      title: "Complete your business profile",
      desc: "We need a few details before approval.",
      save: "Save & continue",
      loading: "Loading...",
      success: "Saved successfully",
      error: "Error",
      required: "Please fill required fields",
    },
    es: {
      title: "Complete su perfil de negocio",
      desc: "Necesitamos algunos datos antes de la aprobación.",
      save: "Guardar y continuar",
      loading: "Cargando...",
      success: "Guardado correctamente",
      error: "Error",
      required: "Por favor complete los campos obligatorios",
    },
  };

  const t = (k: keyof typeof translations.en) =>
    (translations as any)[lang]?.[k] ?? translations.en[k];

  // ✅ پیام‌های ورودی اختیاری
  useEffect(() => {
    const msg = sp.get("msg");
    if (msg === "complete_profile") {
      // فقط اطلاع، کاری لازم نیست
    }
  }, [sp]);

  // ✅ پروفایل را بخوان و فرم را با مقادیر موجود پر کن
  useEffect(() => {
    let mounted = true;

    (async () => {
      setIsLoading(true);

      const { data: { user }, error: userErr } = await supabase.auth.getUser();

      if (!mounted) return;

      if (userErr || !user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("users")
        .select("business_name,cif,tax_id,phone,address,city,postal_code,country")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (!mounted) return;

      if (profileErr) {
        console.error("[register-info] profile fetch error:", profileErr);
      }

      if (profile) {
        setForm({
          business_name: profile.business_name ?? "",
          cif: profile.cif ?? "",
          tax_id: profile.tax_id ?? "",
          phone: profile.phone ?? "",
          address: profile.address ?? "",
          city: profile.city ?? "",
          postal_code: profile.postal_code ?? "",
          country: profile.country ?? "",
        });
      }

      setIsLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  const onChange = (key: keyof typeof form) => (e: any) => {
    const v = e.target.value;
    setForm((prev) => ({ ...prev, [key]: v }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      // حداقل فیلدهای ضروری
      if (
        !form.business_name.trim() ||
        !form.cif.trim() ||
        !form.phone.trim() ||
        !form.address.trim() ||
        !form.city.trim() ||
        !form.country.trim()
      ) {
        toast({ title: t("error"), description: t("required"), variant: "destructive" });
        setSaving(false);
        return;
      }

      // ✅ payload امن: خالی‌ها را اصلا نفرست
      const payload = cleanPayload({
        business_name: form.business_name,
        cif: form.cif,
        tax_id: form.tax_id || null,
        phone: form.phone,
        address: form.address,
        city: form.city,
        postal_code: form.postal_code || null,
        country: form.country,
        is_sso_user: true,
        is_anonymous: false,
      });

      const { error } = await supabase
        .from("users")
        .update(payload)
        .eq("auth_id", user.id);

      if (error) throw error;

      toast({ title: "OK", description: t("success") });
      router.replace("/dashboard?msg=profile_completed");
    } catch (err: any) {
      console.error("[register-info] save error:", err);
      toast({
        title: t("error"),
        description: err?.message || "Save failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="p-8">{t("loading")}</div>;

  return (
    <div className="container mx-auto flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="space-y-2">
              <Label>Business Name *</Label>
              <Input value={form.business_name} onChange={onChange("business_name")} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CIF *</Label>
                <Input value={form.cif} onChange={onChange("cif")} />
              </div>
              <div className="space-y-2">
                <Label>Tax ID</Label>
                <Input value={form.tax_id} onChange={onChange("tax_id")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input value={form.phone} onChange={onChange("phone")} />
            </div>

            <div className="space-y-2">
              <Label>Address *</Label>
              <Input value={form.address} onChange={onChange("address")} />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input value={form.city} onChange={onChange("city")} />
              </div>
              <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input value={form.postal_code} onChange={onChange("postal_code")} />
              </div>
              <div className="space-y-2">
                <Label>Country *</Label>
                <Input value={form.country} onChange={onChange("country")} />
              </div>
            </div>

            <Button className="w-full" type="submit" disabled={saving}>
              {saving ? "Saving..." : t("save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
