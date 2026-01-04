import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * ساخت Supabase server client برای Route Handlers
 * پشتیبانی کامل از session کوکی
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ سرویس رول برای admin
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
