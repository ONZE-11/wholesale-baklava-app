import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: { userId: string }}) {
  const supabase = await createSupabaseServerClient();
  const { userId } = params;
  const body = await req.json();

  const { error } = await supabase
    .from("users")
    .update({ approval_status: "rejected", rejection_notes: body.notes || null })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: "User rejected successfully" });
}
