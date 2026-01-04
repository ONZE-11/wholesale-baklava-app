"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { ShoppingCart, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserMenubar } from "./user-menubar";
import { LanguageSwitcher } from "./language-switcher";
import { useLanguage } from "@/lib/language-context";
import { createSupabaseClient } from "@/lib/supabase/client";

export function Navbar() {
  const pathname = usePathname();
  const { totalItems, clearCart } = useCart();
  const { lang } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // ✅ supabase client ثابت (هر رندر دوباره ساخته نشه)
  const supabase = useMemo(() => createSupabaseClient(), []);

  // ✅ برای اینکه فقط وقتی user واقعا عوض شد cart پاک بشه
  const prevUserIdRef = useRef<string | null>(null);

  // ✅ پاک کردن سبد فقط در تغییر واقعی اکانت (login/logout/switch)
  useEffect(() => {
    let mounted = true;

    // مقدار اولیه prevUserId
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      prevUserIdRef.current = data.user?.id ?? null;
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUserId = session?.user?.id ?? null;
      const prevUserId = prevUserIdRef.current;

      // فقط اگر واقعا تغییر user داریم
      if (prevUserId !== currentUserId) {
        prevUserIdRef.current = currentUserId;

        try {
          localStorage.removeItem("cart");
        } catch {}

        clearCart();
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, clearCart]);

  // ✅ بررسی ادمین بودن از جدول users با role
  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("users")
        .select("role")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (error) {
        setIsAdmin(false);
        return;
      }

      setIsAdmin(profile?.role === "admin");
    };

    checkAdmin();
  }, [supabase, pathname]);

  const t = {
    home: lang === "es" ? "Inicio" : "Home",
    products: lang === "es" ? "Productos" : "Products",
    about: lang === "es" ? "Sobre Nosotros" : "About",
    faq: lang === "es" ? "Preguntas" : "FAQ",
    contact: lang === "es" ? "Contacto" : "Contact",
    admin_login: lang === "es" ? "Acceso Admin" : "Admin",
  };

  const NavLinks = () => (
    <>
      <Link href="/" onClick={() => setIsOpen(false)}>
        {t.home}
      </Link>
      <Link href="/products" onClick={() => setIsOpen(false)}>
        {t.products}
      </Link>
      <Link href="/about" onClick={() => setIsOpen(false)}>
        {t.about}
      </Link>
      <Link href="/faq" onClick={() => setIsOpen(false)}>
        {t.faq}
      </Link>
      <Link href="/contact" onClick={() => setIsOpen(false)}>
        {t.contact}
      </Link>

      {isAdmin && (
        <Link
          href="/admin"
          onClick={() => setIsOpen(false)}
          className="font-bold"
        >
          {t.admin_login}
        </Link>
      )}
    </>
  );

  return (
    <nav className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold text-primary">baklavavalencia</div>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <NavLinks />
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {totalItems}
                </Badge>
              )}
            </Button>
          </Link>

          <UserMenubar lang={lang} />

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-6 mt-8">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
