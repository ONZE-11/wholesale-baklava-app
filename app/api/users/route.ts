import { NextRequest, NextResponse } from "next/server"
import { createSupabaseClient } from "@/lib/supabase/client"
import { db } from "@/lib/db" // جدول users یا profiles

export async function GET(req: NextRequest) {
  try {
 const supabase = createSupabaseClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = await db.users.findByAuthId(authUser.id)

    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      businessName: user.business_name,
      approvalStatus: user.approval_status,
      createdAt: user.created_at,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
