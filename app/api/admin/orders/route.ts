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

function cleanQ(v: string) {
  // برای امن‌تر شدن رشته‌ی or(...) و جلوگیری از خراب شدن لیست
  return v.replaceAll(",", " ").trim();
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v.trim()
  );
}

// YYYY-MM-DD -> ISO (UTC start of day)
function parseYmdToUtcStart(ymd: string) {
  const m = ymd.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return new Date(Date.UTC(y, mo - 1, d, 0, 0, 0)).toISOString();
}

// YYYY-MM-DD -> ISO (UTC start of NEXT day) تا dateTo شامل همان روز باشد
function parseYmdToUtcNextDayStart(ymd: string) {
  const m = ymd.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return new Date(Date.UTC(y, mo - 1, d + 1, 0, 0, 0)).toISOString();
}

export async function GET(req: NextRequest) {
  try {
    // 1) session client: فقط برای auth + role
    const sessionClient = await createSupabaseServerClient();
    const adminCheck = await requireAdmin(sessionClient);
    if (!adminCheck.ok) return adminCheck.res;

    // 2) admin client: Service Role برای خواندن بدون RLS
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(url, serviceKey);

    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get("pageSize") || "20", 10), 1),
      100
    );

    const status = searchParams.get("status") || "";

    const qRaw = searchParams.get("q") || "";
    const q = qRaw ? cleanQ(qRaw) : "";
    const qIsUuid = q ? isUuid(q) : false;

    const dateFrom = searchParams.get("dateFrom") || ""; // YYYY-MM-DD
    const dateTo = searchParams.get("dateTo") || "";     // YYYY-MM-DD

    const dateFromIso = dateFrom ? parseYmdToUtcStart(dateFrom) : null;
    const dateToIsoExclusive = dateTo ? parseYmdToUtcNextDayStart(dateTo) : null;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 3) اگر q متنی باشد، userها را پیدا کن (business_name/email)
    // چون orders.user_id == users.auth_id
    let matchedAuthIds: string[] = [];
    if (q && !qIsUuid) {
      const { data: usersHit, error: usersHitErr } = await supabaseAdmin
        .from("users")
        .select("auth_id")
        .or(`business_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(500);

      if (!usersHitErr && usersHit?.length) {
        matchedAuthIds = (usersHit as any[])
          .map((u) => u.auth_id)
          .filter(Boolean);
      }
    }

    // 4) Orders query
    let query = supabaseAdmin
      .from("orders")
      .select("id, created_at, status, total_amount, user_id, payment_method", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status) query = query.eq("status", status);

    // Date range
    if (dateFromIso) query = query.gte("created_at", dateFromIso);
    if (dateToIsoExclusive) query = query.lt("created_at", dateToIsoExclusive);

    // Global search
    if (q) {
      if (qIsUuid) {
        // ✅ روی uuid فقط eq می‌زنیم (نه ilike)
        query = query.or(`id.eq.${q},user_id.eq.${q}`);
      } else if (matchedAuthIds.length > 0) {
        // ✅ سرچ نام/ایمیل => orders.user_id IN (matchedAuthIds)
        query = query.or(`user_id.in.(${matchedAuthIds.join(",")})`);
      } else {
        // هیچ چیزی match نشده => نتیجه خالی
        query = query.eq("id", "__never__");
      }
    }

    const { data: orders, error: ordersErr, count } = await query;

    if (ordersErr) {
      return NextResponse.json({ error: ordersErr.message }, { status: 400 });
    }

    const rows = orders || [];

    // 5) Enrich users for current page
    const authIds = Array.from(
      new Set(rows.map((o: any) => o.user_id).filter(Boolean))
    );

    const usersByAuthId = new Map<
      string,
      { business_name: string | null; email: string | null }
    >();

    if (authIds.length > 0) {
      const { data: users, error: usersErr } = await supabaseAdmin
        .from("users")
        .select("auth_id, business_name, email")
        .in("auth_id", authIds);

      if (!usersErr && users) {
        for (const u of users as any[]) {
          usersByAuthId.set(u.auth_id, {
            business_name: u.business_name ?? null,
            email: u.email ?? null,
          });
        }
      }
    }

    const enriched = rows.map((o: any) => {
      const u = usersByAuthId.get(o.user_id);
      return {
        ...o,
        business_name: u?.business_name ?? null,
        user_email: u?.email ?? null,
      };
    });

    return NextResponse.json({
      data: enriched,
      meta: { page, pageSize, total: count || 0 },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
