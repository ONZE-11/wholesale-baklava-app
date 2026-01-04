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
  if (!url || !key)
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

function siteUrl() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://baklavavalencia.es";
  // حذف اسلش آخر برای جلوگیری از //reset-password
  return base.replace(/\/+$/, "");
}

function isAlreadyRegistered(msg?: string) {
  const m = (msg || "").toLowerCase();
  return (
    m.includes("already") || m.includes("registered") || m.includes("exists")
  );
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

async function generateInviteOrRecoveryLink(
  admin: any,
  email: string,
  redirectTo: string
) {
  const invite = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo },
  });

  if (!invite.error && invite.data?.properties?.action_link) {
    return {
      mode: "invite" as const,
      actionLink: invite.data.properties.action_link,
      createdUserId: invite.data.user?.id ?? null,
    };
  }

  if (invite.error && isAlreadyRegistered(invite.error.message)) {
    const recovery = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (!recovery.error && recovery.data?.properties?.action_link) {
      return {
        mode: "recovery" as const,
        actionLink: recovery.data.properties.action_link,
        createdUserId: recovery.data.user?.id ?? null,
      };
    }

    throw new Error(
      `Generate recovery link failed: ${
        recovery.error?.message || "Unknown error"
      }`
    );
  }

  throw new Error(
    `Generate invite link failed: ${invite.error?.message || "Unknown error"}`
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("ADMIN BODY:", body);
    console.log("CIF:", body?.cif);

    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    const business_name = String(
      body?.business_name || body?.businessName || ""
    ).trim();

    if (!email)
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    if (!business_name)
      return NextResponse.json(
        { success: false, error: "Business name is required" },
        { status: 400 }
      );

    const admin = adminClient();

    // ✅ مقصد درست برای set password
    // اگر از فرانت redirectTo فرستادی، همان را استفاده می‌کنیم
    // وگرنه پیش‌فرض: /reset-password (نه /auth/callback)
    const bodyLang =
      body?.lang === "es" ? "es" : body?.lang === "en" ? "en" : null;
    const defaultRedirect = `${siteUrl()}/reset-password${
      bodyLang ? `?lang=${bodyLang}` : ""
    }`;

    const redirectTo = String(body?.redirectTo || defaultRedirect);

    // 1) لینک invite یا recovery
    const { mode, actionLink, createdUserId } =
      await generateInviteOrRecoveryLink(admin, email, redirectTo);

    // 2) upsert پروفایل
    const cifValue =
      body?.cif ?? body?.CIF ?? body?.cifNumber ?? body?.cif_number ?? null;

    const insertData = {
      email,
      auth_id: createdUserId ?? null,
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

    // 3) ارسال ایمیل
    const subject =
      mode === "invite" ? "Set your password" : "Reset your password";
    const htmlContent = `
      <p>Hi ${business_name || "there"},</p>
      <p>${
        mode === "invite"
          ? "Please set your password using the link below:"
          : "You can reset your password using the link below:"
      }</p>
      <p><a href="${actionLink}" target="_blank" rel="noreferrer">Open link</a></p>
      <p>If the button doesn't work, copy and paste this URL:</p>
      <p>${actionLink}</p>
    `;

    await sendBrevoEmail(email, business_name, subject, htmlContent);

    return NextResponse.json({
      success: true,
      user: profile,
      emailSent: true,
      linkMode: mode,
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
