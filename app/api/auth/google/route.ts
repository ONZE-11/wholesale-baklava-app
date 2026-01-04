import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    // ✅ مقداردهی صحیح آرگومان‌ها
    const supabase = createSupabaseClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      url: data.url,
    });
  } catch (error: any) {
    console.error("[v0] Google auth error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
