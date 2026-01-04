import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/* ================= GET ================= */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id,
        name_en,
        name_es,
        price,
        min_order_quantity,
        packaging_en,
        packaging_es,
        shelf_life_en,
        shelf_life_es
      `
      )
      .order("display_order", { ascending: true });

    if (error) {
      console.error("GET products error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, products: data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

/* ================= PUT ================= */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};
    for (const key of [
      "name_en",
      "name_es",
      "price",
      "min_order_quantity",
      "packaging_en",
      "packaging_es",
      "shelf_life_en",
      "shelf_life_es",
    ]) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", body.id)
      .select(
        `
        id,
        name_en,
        name_es,
        price,
        min_order_quantity,
        packaging_en,
        packaging_es,
        shelf_life_en,
        shelf_life_es
      `
      )
      .single();

    if (error) {
      console.error("PUT products error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, product: data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
