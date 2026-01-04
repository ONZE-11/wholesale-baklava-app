import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await (await supabase)
    .from("products")
    .select("id, name_en");

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, products: data ?? [] });
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json(); // { id, name_en }
    if (!body.id) return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 });

    const supabase = createSupabaseServerClient();
    const { data, error } = await (await supabase)
      .from("products")
      .update({ name_en: body.name_en })
      .eq("id", body.id)
      .select("id, name_en"); // مهم: select بعد از update تا نتیجه برگرده

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, product: data?.[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
