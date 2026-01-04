// app/api/admin/users/[id]/request-docs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();

    // 1. دریافت session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUser = sessionData.session.user;

    // 2. بررسی اینکه کاربر ادمین است
    const { data: admin, error: adminError } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", currentUser.id)
      .single();

    if (adminError || admin?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. unwrap params
    const { id } = await params;
    console.log("Requested user ID:", id);

    // 4. پیام پیشفرض
    let message = "Please upload your documents.";
    try {
      const body = await req.json();
      message = body?.message || message;
    } catch (err) {
      console.log("No message in request body, using default");
    }

    // 5. دریافت ایمیل و business_name کاربر
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email, business_name")
      .eq("id", id)
      .single();

    if (userError || !user?.email) {
      console.error("User not found:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userEmail = user.email;
    const userName = user.business_name || "User";

    // 6. ارسال ایمیل با Brevo
    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: {
          email: process.env.EMAIL_FROM!,
          name: "baklavavalencia",
        },
        to: [{ email: userEmail, name: userName }],
        replyTo: {
          email: "mairesmaster@gmail.com",
          name: "Majid",
        },
        subject: "Document request / Solicitud de documentos",
        htmlContent: `
      <p>Hi ${userName},</p>
      ${t("email.request_docs_text", "en")}
      <hr/>
      <p>Hola ${userName},</p>
      ${t("email.request_docs_text", "es")}
    `,
      }),
    });
    const result = await brevoResponse.json();
    console.log("BREVO RESPONSE:", brevoResponse.status, result);

    if (!brevoResponse.ok) {
      return NextResponse.json(
        { error: "Email sending failed", details: result },
        { status: 500 }
      );
    }

    // 7. پاسخ موفق
    return NextResponse.json({
      success: true,
      contact: {
        email: userEmail,
      },
    });
  } catch (err: any) {
    console.error("REQUEST DOCS ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
