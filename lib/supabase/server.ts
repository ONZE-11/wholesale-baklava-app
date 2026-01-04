import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function cookieAdapter() {
  const cookieStore = cookies();

  return {
    async getAll() {
      return (await cookieStore).getAll();
    },
    setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
      cookiesToSet.forEach(async ({ name, value, options }) => {
        (await cookieStore).set(name, value, options);
      });
    },
  };
}

/** ✅ برای Route Handlers: استفاده‌ی معمول (Anon Key) */
export function createSupabaseServerClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter() }
  );
}

/** ⚠️ فقط برای کارهای ادمینی و سرور-فقط (Service Role) */
export function createSupabaseAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: cookieAdapter() }
  );
}
