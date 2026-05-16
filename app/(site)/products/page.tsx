import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductsClient from "./products-client";

export default async function ProductsPage() {
  const supabase = createSupabaseServerClient();

  // Fetch products and auth session in parallel
  const [productsResult, authResult] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .order("display_order", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  const products = productsResult.data ?? [];
  const user = authResult.data?.user ?? null;

  let initialIsAuthenticated = false;
  let initialApprovalStatus = "pending";

  if (user) {
    initialIsAuthenticated = true;
    const { data: profile } = await supabase
      .from("users")
      .select("approval_status")
      .eq("auth_id", user.id)
      .single();
    initialApprovalStatus = profile?.approval_status ?? "pending";
  }

  return (
    <ProductsClient
      initialProducts={products}
      initialIsAuthenticated={initialIsAuthenticated}
      initialApprovalStatus={initialApprovalStatus}
    />
  );
}
