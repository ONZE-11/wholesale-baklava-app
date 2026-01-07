// proxy.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ 0) Stripe webhook: هیچ کاری نکن
  if (pathname.startsWith("/api/stripe/webhook")) {
    return NextResponse.next();
  }

  // ✅ 1) مسیرهای auth/callback را دست نزن (خیلی مهم برای موبایل)
  const bypassPaths = ["/reset-password", "/forgot-password", "/login", "/auth"];
  if (bypassPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ✅ 2) فقط مسیرهای محافظت‌شده را چک کن
  const protectedRoutes = ["/dashboard", "/checkout"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // اگر محافظت‌شده نیست، اصلاً سراغ Supabase نرو (نه getUser، نه کوکی)
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // ✅ 3) از اینجا به بعد فقط برای protected routes
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // اگر env نداریم، مثل لاگین‌نبودن برخورد کن
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Next توصیه می‌کنه روی request.cookies set نکنی، ولی SSR helper ها این الگو را استفاده می‌کنن.
        // نکته‌ی مهم اینه که فقط برای protected routes داریم این کارو می‌کنیم.
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        supabaseResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // اگر خطا یا user نداریم -> بفرست لاگین
  if (error || !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
