import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[v0] Logout error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
