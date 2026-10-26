import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    (v || "").trim()
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // ✅ کاربر لاگین باشد
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const authUser = userData.user;

    if (userErr || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.orderId || "").trim();

    if (!orderId || !isUuid(orderId)) {
      return NextResponse.json(
        { error: "Invalid orderId", got: orderId || null },
        { status: 400 }
      );
    }

    // ✅ پروفایل (همان id که در orders.user_id ذخیره می‌کنی)
    const { data: profile, error: profileErr } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", authUser.id)
      .single();

    if (profileErr || !profile?.id) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 400 }
      );
    }

    // ✅ فقط سفارش خود کاربر
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, payment_status, status, user_id")
      .eq("id", orderId)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (orderErr) {
      return NextResponse.json({ error: orderErr.message }, { status: 400 });
    }
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // اگر پرداخت شده، دست نزن
    if (order.payment_status === "paid") {
      return NextResponse.json({ ok: true, skipped: "already_paid" });
    }

    // ✅ فقط اگر هنوز unpaid/pending است حذف کن
    // (اگر خواستی سخت‌گیرتر باشی همینجا چک کن status هم pending باشد)
    // if (order.status !== "pending" || order.payment_status !== "unpaid") ...

    // ✅ حذف آیتم‌ها بعد حذف سفارش
    const { error: delItemsErr } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId);

    if (delItemsErr) {
      return NextResponse.json({ error: delItemsErr.message }, { status: 400 });
    }

    const { error: delOrderErr } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId)
      .eq("user_id", profile.id);

    if (delOrderErr) {
      return NextResponse.json({ error: delOrderErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
