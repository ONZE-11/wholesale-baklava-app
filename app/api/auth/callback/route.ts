import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isProfileIncomplete(p: any) {
  return (
    !p?.business_name ||
    !p?.cif ||
    !p?.phone ||
    !p?.address ||
    !p?.city ||
    !p?.country
  );
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const lang = url.searchParams.get("lang") === "es" ? "es" : "en";

  if (!code) return NextResponse.redirect(`${url.origin}/login?lang=${lang}`);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${url.origin}/login?lang=${lang}&error=auth_failed`);
  }

  const authUser = data.user;

  const { data: existingUser, error: existingErr } = await supabase
    .from("users")
    .select("id, business_name, cif, phone, address, city, country, approval_status")
    .eq("auth_id", authUser.id)
    .maybeSingle();

  if (existingErr) {
    console.error("[auth/callback] profile lookup error:", existingErr);
    // امن‌ترین رفتار: برو داشبورد (session هست)، یا اگر می‌خواهی یک notice عمومی خطا بده
    return NextResponse.redirect(`${url.origin}/dashboard?lang=${lang}`);
  }

  // پروفایل وجود دارد
  if (existingUser) {
    if (isProfileIncomplete(existingUser)) {
      return NextResponse.redirect(`${url.origin}/register-info?lang=${lang}`);
    }
    return NextResponse.redirect(`${url.origin}/dashboard?lang=${lang}`);
  }

  // پروفایل وجود ندارد (کاربر جدید با SSO)
  return NextResponse.redirect(
    `${url.origin}/auth/notice?lang=${lang}&msg=welcome_sso&next=/register-info`
  );
}
