import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireAdmin(sessionClient: any) {
  const { data: sessionData, error: sessionError } =
    await sessionClient.auth.getSession();

  if (sessionError) {
    return {
      ok: false,
      res: NextResponse.json({ error: sessionError.message }, { status: 401 }),
    };
  }

  const session = sessionData.session;
  if (!session?.user) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: userRow, error: userErr } = await sessionClient
    .from("users")
    .select("role")
    .eq("auth_id", session.user.id)
    .single();

  if (userErr) {
    return {
      ok: false,
      res: NextResponse.json({ error: userErr.message }, { status: 403 }),
    };
  }

  if (!userRow || userRow.role !== "admin") {
    return {
      ok: false,
      res: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true };
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, serviceKey);
}

function extractId(req: NextRequest, params?: Record<string, string>) {
  const fromParams =
    params?.id || params?.orderId || params?.order_id || params?.slug;
  if (fromParams) return String(fromParams);

  const { pathname } = new URL(req.url);
  const parts = pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

async function loadUserByOrderUserId(supabaseAdmin: any, orderUserId: string) {
  const tryAuth = await supabaseAdmin
    .from("users")
    .select("email, business_name")
    .eq("auth_id", orderUserId)
    .maybeSingle();

  if (!tryAuth.error && tryAuth.data) {
    return {
      email: tryAuth.data.email ?? null,
      business_name: tryAuth.data.business_name ?? null,
    };
  }

  const tryId = await supabaseAdmin
    .from("users")
    .select("email, business_name")
    .eq("id", orderUserId)
    .maybeSingle();

  if (!tryId.error && tryId.data) {
    return {
      email: tryId.data.email ?? null,
      business_name: tryId.data.business_name ?? null,
    };
  }

  return { email: null, business_name: null };
}

async function loadItemsWithProducts(supabaseAdmin: any, orderId: string) {
  const { data, error } = await supabaseAdmin
    .from("order_items")
    .select(
      "id, product_id, quantity, unit_price, subtotal, products(name_en, name_es)"
    )
    .eq("order_id", orderId);

  if (error) throw error;

  return (data || []).map((it: any) => ({
    id: it.id,
    product_id: it.product_id,
    quantity: it.quantity,
    unit_price: it.unit_price,
    subtotal: it.subtotal,
    name_en: it.products?.name_en ?? "Unknown product",
    name_es: it.products?.name_es ?? "Producto desconocido",
  }));
}

export async function GET(
  req: NextRequest,
  ctx: { params?: Record<string, string> }
) {
  try {
    const sessionClient = await createSupabaseServerClient();
    const adminCheck = await requireAdmin(sessionClient);
    if (!adminCheck.ok) return adminCheck.res;

    const supabaseAdmin = getAdminClient();

    const id = extractId(req, ctx?.params);
    if (!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (orderErr) {
      return NextResponse.json({ error: orderErr.message }, { status: 400 });
    }
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const userId = order.user_id ? String(order.user_id) : "";
    const u =
      userId.length > 0
        ? await loadUserByOrderUserId(supabaseAdmin, userId)
        : { email: null, business_name: null };

    // ✅ اینجا درست شد: items همراه نام محصول
    const items = await loadItemsWithProducts(supabaseAdmin, String(order.id));

    return NextResponse.json({
      order: {
        ...order,
        user_email: u.email,
        business_name: u.business_name,
      },
      items,
      user_email: u.email,
      business_name: u.business_name,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params?: Record<string, string> }
) {
  try {
    const sessionClient = await createSupabaseServerClient();
    const adminCheck = await requireAdmin(sessionClient);
    if (!adminCheck.ok) return adminCheck.res;

    const supabaseAdmin = getAdminClient();

    const id = extractId(req, ctx?.params);
    if (!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    const patch: Record<string, any> = {};
    if (typeof body.status === "string") patch.status = body.status;
    if (typeof body.payment_status === "string")
      patch.payment_status = body.payment_status;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
