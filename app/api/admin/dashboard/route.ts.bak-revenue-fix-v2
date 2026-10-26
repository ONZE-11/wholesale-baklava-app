import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    // 1) auth check
    const sessionClient = await createSupabaseServerClient();
    const adminCheck = await requireAdmin(sessionClient);
    if (!adminCheck.ok) return adminCheck.res;

    // 2) service role client
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(url, serviceKey);

    // orders count
    const { count: ordersCount, error: ordersErr } = await supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true });

    if (ordersErr) throw new Error(ordersErr.message);

    // users count
    const { count: usersCount, error: usersErr } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true });

    if (usersErr) throw new Error(usersErr.message);

    // revenue sum (اگر total_amount عددی است)
    const { data: revenueRows, error: revenueErr } = await supabaseAdmin
      .from("orders")
      .select("total_amount");

    if (revenueErr) throw new Error(revenueErr.message);

    const revenue = (revenueRows || []).reduce((acc: number, r: any) => {
      const n = Number(r.total_amount);
      return Number.isFinite(n) ? acc + n : acc;
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        orders: ordersCount ?? 0,
        users: usersCount ?? 0,
        revenue,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
