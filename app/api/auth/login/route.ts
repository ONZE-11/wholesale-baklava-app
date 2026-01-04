import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/client";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // ✅ مقداردهی صحیح آرگومان‌ها
    const supabase = createSupabaseClient();

    // Sign in with Supabase
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to authenticate" },
        { status: 500 }
      );
    }

    // Get user profile
    const user = await db.users.findByAuthId(authData.user.id);

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        businessName: user.business_name,
        approvalStatus: user.approval_status,
      },
    });
  } catch (error: any) {
    console.error("[v0] Login error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
