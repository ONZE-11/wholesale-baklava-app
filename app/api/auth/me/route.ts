import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

type User = {
  id: string;
  auth_id: string;
  email: string;
  business_name: string;
  cif?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  approval_status: string;
  created_at: string;
  tax_id?: string | null;
  is_sso_user?: boolean;
  is_anonymous?: boolean;
  role: string;
};

export async function GET(_request: NextRequest) {
  try {
    // ✅ مهم: server client که کوکی‌ها رو می‌خونه
    const supabase = await createSupabaseServerClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const dbUser = await db.users.findByAuthId(authUser.id);

    if (!dbUser) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const user: User = {
      ...dbUser,
      created_at: dbUser.created_at.toISOString(),
    };

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        businessName: user.business_name,
        cif: user.cif ?? null,
        phone: user.phone ?? null,
        address: user.address ?? null,
        city: user.city ?? null,
        postalCode: user.postal_code ?? null,
        country: user.country ?? null,
        approvalStatus: user.approval_status,
        createdAt: user.created_at,
        taxId: user.tax_id ?? null,
        isSsoUser: user.is_sso_user ?? null,
        isAnonymous: user.is_anonymous ?? null,
        role: user.role,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    console.error("[auth/me] Get user error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
