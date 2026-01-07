// lib/supabase/email-callback-client.ts
import { createClient } from "@supabase/supabase-js";

export function createEmailCallbackSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "implicit",        // ✅ حیاتی برای invite لینک‌ها
        detectSessionInUrl: true,    // ✅ توکن/هش را از URL بگیرد
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );
}
