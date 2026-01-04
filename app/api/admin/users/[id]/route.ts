import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SAFE_SELECT = `
  id,
  auth_id,
  email,
  business_name,
  cif,
  role,
  approval_status,
  phone,
  address,
  city,
  postal_code,
  country,
  tax_id,
  created_at,
  rejection_notes
`;


function getId(request: NextRequest, params?: { id?: string }) {
  // 1) Next params
  const fromParams = params?.id;
  if (fromParams) return fromParams;

  // 2) Fallback: parse from URL: /api/admin/users/<id>
  const parts = new URL(request.url).pathname.split("/");
  const last = parts[parts.length - 1];
  return last || null;
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();
  const id = getId(request, context?.params);

  console.log("PATCH users/[id] url=", request.url, "id=", id);

  if (!id) {
    return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
  }

  const body = await request.json();
  const status = body?.status as string;

  const allowed = new Set(["pending", "approved", "rejected", "request_docs"]);
  if (!allowed.has(status)) {
    return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
  }

  const updateData: any = {
    approval_status: status,
    rejection_notes: status === "rejected" ? (body.notes ?? null) : null,
  };

  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", id)
    .select(SAFE_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, user: data });
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();
  const id = getId(request, context?.params);

  if (!id) {
    return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
  }

  const body = await request.json();

  // ✅ allowlist کامل
  const allowed: any = {
    business_name: body.business_name ?? null,
    cif: body.cif ?? null,
    tax_id: body.tax_id ?? null,
    phone: body.phone ?? null,
    address: body.address ?? null,
    city: body.city ?? null,
    postal_code: body.postal_code ?? null,
    country: body.country ?? null,
    role: body.role ?? null,
    approval_status: body.approval_status ?? undefined, // اگر خواستی قابل ادیت باشه
  };

  // حذف undefined ها (تا چیزی ناخواسته overwrite نشه)
  Object.keys(allowed).forEach((k) => allowed[k] === undefined && delete allowed[k]);

  const { data, error } = await supabase
    .from("users")
    .update(allowed)
    .eq("id", id)
    .select(SAFE_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, user: data });
}


export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const supabaseServer = await createSupabaseServerClient();
  const id = getId(request, context?.params);

  console.log("DELETE users/[id] url=", request.url, "id=", id);

  if (!id) {
    return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
  }

  // ✅ فقط ادمین
  const { data: auth } = await supabaseServer.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: me } = await supabaseServer
    .from("users")
    .select("role")
    .eq("auth_id", auth.user.id)
    .single();

  if (me?.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const supabaseAdmin = getAdminSupabase();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { success: false, error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env" },
      { status: 500 }
    );
  }

  // 1) auth_id رو از پروفایل بگیر
  const { data: userRow, error: fetchErr } = await supabaseAdmin
    .from("users")
    .select("id, auth_id, email")
    .eq("id", id)
    .single();

  if (fetchErr || !userRow) {
    return NextResponse.json({ success: false, error: fetchErr?.message || "User not found" }, { status: 404 });
  }

  let authDeleted = false;
  let warning: string | null = null;

  // 2) تلاش برای حذف از Auth (اما اگر نبود، ادامه بده)
  if (userRow.auth_id) {
    const { error: delAuthErr } = await supabaseAdmin.auth.admin.deleteUser(userRow.auth_id);

    if (delAuthErr) {
      const msg = (delAuthErr.message || "").toLowerCase();

      // ✅ اگر auth user وجود نداشت، fatal نیست
      if (msg.includes("user not found") || msg.includes("not found")) {
        warning = "Auth user was not found, profile deleted only.";
      } else {
        // سایر خطاها مهم‌ترند، ولی باز هم می‌تونیم تصمیم بگیریم ادامه بدیم یا نه
        // اینجا ادامه می‌دیم ولی هشدار می‌دیم
        warning = `Auth delete failed: ${delAuthErr.message}. Profile deleted only.`;
      }
    } else {
      authDeleted = true;
    }
  } else {
    warning = "auth_id missing on profile, profile deleted only.";
  }

  // 3) حذف از جدول users همیشه انجام شود
  const { data: deletedUser, error: delProfileErr } = await supabaseAdmin
    .from("users")
    .delete()
    .eq("id", id)
    .select(SAFE_SELECT)
    .single();

  if (delProfileErr) {
    return NextResponse.json({ success: false, error: delProfileErr.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    deletedUser,
    authDeleted,
    warning,
  });
}


function getAdminSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceRoleKey) {
    return null;
  }
  
  const { createClient } = require("@supabase/supabase-js");
  return createClient(url, serviceRoleKey);
}

