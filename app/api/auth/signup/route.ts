import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password, businessName, cif, taxId, phone, address, city, country } =
      await req.json();

    const supabase = await createSupabaseServerClient();

    // ایجاد کاربر در Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

    // اضافه کردن رکورد در جدول users
    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .insert({
        email,
        auth_id: authData.user!.id,
        business_name: businessName,
        cif,
        tax_id: taxId || null,
        phone,
        address,
        city,
        country,
      })
      .select();

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });

    return NextResponse.json({ user: authData.user, profile: profileData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
