import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("approval_status", "pending");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
