import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// همون safeJson خودت لازم نیست اینجا
function adminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

function siteUrl() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://baklavavalencia.es";
  return base.replace(/\/+$/, "");
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

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`Brevo failed: ${r.status} ${txt}`);
  }
}

async function generateRecoveryLink(admin: any, email: string, redirectTo: string) {
  const recovery = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  const actionLink = recovery.data?.properties?.action_link ?? null;
  if (recovery.error || !actionLink) {
    throw new Error(
      `Generate recovery link failed: ${recovery.error?.message || "Unknown error"}`
    );
  }

  return actionLink;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const businessName = String(body?.business_name || body?.businessName || "").trim();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const lang = body?.lang === "en" ? "en" : body?.lang === "es" ? "es" : null;

    const redirectTo =
      String(body?.redirectTo || "") ||
      `${siteUrl()}/reset-password${lang ? `?lang=${lang}` : ""}`;

    const admin = adminClient();

    // مطمئن شو auth user وجود دارد (اگر نبود بساز)
    try {
      await admin.auth.admin.createUser({ email, email_confirm: true });
    } catch {
      // اگر وجود داشت، مهم نیست
    }

    const actionLink = await generateRecoveryLink(admin, email, redirectTo);

    const subject = "Set your password";
    const htmlContent = `
      <p>Hi ${businessName || "there"},</p>
      <p>Please set your password using the link below:</p>
      <p><a href="${actionLink}" target="_blank" rel="noreferrer">Open link</a></p>
      <p>If the button doesn't work, copy and paste this URL:</p>
      <p>${actionLink}</p>
    `;

    await sendBrevoEmail(email, businessName || email, subject, htmlContent);

    return NextResponse.json({
      success: true,
      emailSent: true,
      redirectToUsed: redirectTo,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
