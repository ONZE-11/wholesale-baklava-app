"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

type ApprovalStatus = "pending" | "approved" | "rejected" | "request_docs";

export function useAuthMe() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>("pending");

  useEffect(() => {
    let mounted = true;
    const supabase = createSupabaseClient();

    (async () => {
      try {
        // 1) وضعیت لاگین از خود Supabase Client
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (!mounted) return;

        if (userError || !user) {
          setIsAuthenticated(false);
          setApprovalStatus("pending");
          return;
        }

        setIsAuthenticated(true);

        // 2) گرفتن approval_status از جدول users
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("approval_status")
          .eq("auth_id", user.id)
          .single();

        if (!mounted) return;

        if (profileError || !profile?.approval_status) {
          setApprovalStatus("pending");
          return;
        }

        setApprovalStatus(profile.approval_status as ApprovalStatus);
      } catch {
        if (!mounted) return;
        setIsAuthenticated(false);
        setApprovalStatus("pending");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { loading, isAuthenticated, approvalStatus };
}
