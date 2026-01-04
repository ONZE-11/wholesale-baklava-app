// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import { useMemo } from 'react';

export function createSupabaseClient(p0?: { accessToken: string; }) {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Hook برای استفاده راحت در کامپوننت‌ها
export function useSupabase() {
  const client = useMemo(() => createSupabaseClient(), []);
  return client;
}
