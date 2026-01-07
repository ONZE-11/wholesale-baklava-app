import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SAFE_SELECT = `
  id,
  auth_id,
  email,
  business_name,
  cif,
  role,
  approval_status,
  phone,
  address,
  city,
  postal_code,
  country,
  tax_id,
  created_at,
  rejection_notes
`;

function adminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function siteUrl() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://baklavavalencia.es";
  return base.replace(/\/+$/, "");
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
}

async function sendBrevoEmail(
  toEmail: string,
  toName: string,
  subject: string,
  htmlContent: string
) {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey) throw new Error("Missing BREVO_API_KEY");
  if (!from) throw new Error("Missing EMAIL_FROM");

  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": apiKey },
    body: JSON.stringify({
      sender: { email: from, name: "BaklavaValencia" },
      to: [{ email: toEmail, name: toName || toEmail }],
      subject,
      htmlContent,
    }),
  });

  const j = await safeJson(r);
  if (!r.ok) throw new Error(`Brevo failed: ${r.status} ${JSON.stringify(j)}`);
}

/**
 * ✅ سناریوی 2: همیشه Recovery link (Set Password) بساز
 * نکته: generateLink(type=recovery) هم برای کاربر موجود و هم برای تازه‌ساخته قابل استفاده است.
 */
async function generateRecoveryLink(admin: any, email: string, redirectTo: string) {
  const recovery = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  const actionLink = recovery.data?.properties?.action_link ?? null;
  const userId = recovery.data?.user?.id ?? null;

  if (recovery.error || !actionLink) {
    throw new Error(
      `Generate recovery link failed: ${recovery.error?.message || "Unknown error"}`
    );
  }

  return { actionLink, userId };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const email = String(body?.email || "").trim().toLowerCase();
    const business_name = String(body?.business_name || body?.businessName || "").trim();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }
    if (!business_name) {
      return NextResponse.json(
        { success: false, error: "Business name is required" },
        { status: 400 }
      );
    }

    const admin = adminClient();

    // ✅ redirectTo: مقصد set password
    const bodyLang =
      body?.lang === "es" ? "es" : body?.lang === "en" ? "en" : null;

    const defaultRedirect = `${siteUrl()}/reset-password${
      bodyLang ? `?lang=${bodyLang}` : ""
    }`;

    const redirectTo = String(body?.redirectTo || defaultRedirect);

    /**
     * ✅ اطمینان از وجود Auth user
     * اگر از قبل وجود داشته باشد، Supabase خطا می‌دهد. ما بی‌خیال می‌شویم.
     * (چون upsert پروفایل را جداگانه انجام می‌دهیم)
     */
    try {
      await admin.auth.admin.createUser({
        email,
        email_confirm: true, // اگر می‌خواهی تایید ایمیل الزامی باشد false کن
      });
    } catch {
      // عمدی: اگر قبلاً وجود داشت، مشکلی نیست
    }

    // ✅ همیشه لینک Recovery تولید کن
    const { actionLink, userId } = await generateRecoveryLink(admin, email, redirectTo);

    // ✅ upsert پروفایل
    const cifValue =
      body?.cif ?? body?.CIF ?? body?.cifNumber ?? body?.cif_number ?? null;

    const insertData = {
      email,
      auth_id: userId ?? null,
      business_name,
      cif: typeof cifValue === "string" ? cifValue.trim() : cifValue,
      phone: body?.phone ?? null,
      address: body?.address ?? null,
      city: body?.city ?? null,
      postal_code: body?.postal_code ?? body?.postalCode ?? null,
      country: body?.country ?? null,
      tax_id: body?.tax_id ?? body?.taxId ?? null,
      role: body?.role ?? "user",
      approval_status: body?.approval_status ?? "pending",
    };

    const { data: profile, error: upsertErr } = await admin
      .from("users")
      .upsert(insertData, { onConflict: "email" })
      .select(SAFE_SELECT)
      .single();

    if (upsertErr) {
      return NextResponse.json(
        { success: false, error: upsertErr.message },
        { status: 400 }
      );
    }

    // ✅ ارسال ایمیل Set Password (همیشه recovery)
    const subject = "Set your password";
    const htmlContent = `
      <p>Hi ${business_name || "there"},</p>
      <p>Please set your password using the link below:</p>
      <p><a href="${actionLink}" target="_blank" rel="noreferrer">Open link</a></p>
      <p>If the button doesn't work, copy and paste this URL:</p>
      <p>${actionLink}</p>
    `;

    await sendBrevoEmail(email, business_name, subject, htmlContent);

    return NextResponse.json({
      success: true,
      user: profile,
      emailSent: true,
      linkMode: "recovery",
      redirectToUsed: redirectTo,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = supabase
    .from("users")
    .select(SAFE_SELECT)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("approval_status", status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, users: data ?? [] },
    { headers: { "Cache-Control": "no-store" } }
  );
}
