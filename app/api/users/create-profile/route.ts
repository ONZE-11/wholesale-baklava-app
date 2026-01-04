// import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@supabase/supabase-js";

// const supabaseUrl = process.env.SUPABASE_URL!;
// const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// if (!supabaseUrl || !supabaseServiceRoleKey) {
//   throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in .env");
// }

// const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const {
//       email,
//       password,
//       business_name,
//       cif,
//       tax_id,
//       phone,
//       address,
//       city,
//       postal_code,
//       country,
//     } = body;

//     // اعتبارسنجی اولیه
//     if (!email || !password || !business_name || !cif) {
//       return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
//     }

//     console.log("[DEBUG] Creating user in Supabase Auth:", email);

//     // ایجاد کاربر در auth با Service Role Key
//     const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
//       email,
//       password,
//       email_confirm: true,
//     });

//     if (authError) {
//       console.error("[ERROR] Auth creation failed:", authError);
//       return NextResponse.json({ error: authError.message }, { status: 400 });
//     }

//     if (!authUser.user) {
//       console.error("[ERROR] Auth user is undefined:", authUser);
//       return NextResponse.json({ error: "User not created" }, { status: 500 });
//     }

//     const userId = authUser.user.id;
//     console.log("[DEBUG] Auth user created with ID:", userId);

//     // ایجاد رکورد در جدول users
//     console.log("[DEBUG] Inserting user profile in 'users' table...");
//     const { data: userProfile, error: profileError } = await supabase
//       .from("users")
//       .insert([
//         {
//           auth_id: userId,
//           email,
//           business_name,
//           cif,
//           tax_id: tax_id || null,
//           phone: phone || null,
//           address: address || null,
//           city: city || null,
//           postal_code: postal_code || null,
//           country: country || null,
//           approval_status: "pending",
//           is_sso_user: false,
//           is_anonymous: false,
//         },
//       ])
//       .select()
//       .single();

//     if (profileError) {
//       console.error("[ERROR] User profile insert failed:", profileError);
//       return NextResponse.json({ error: profileError.message }, { status: 400 });
//     }

//     console.log("[DEBUG] User profile inserted successfully:", userProfile);

//     return NextResponse.json({ user: userProfile });
//   } catch (error: any) {
//     console.error("[ERROR] Unexpected error in POST /api/users/create-profile:", error);
//     return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
//   }
// }
