"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { ShoppingCart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserMenubar } from "./user-menubar";
import { LanguageSwitcher } from "./language-switcher";
import { useLanguage } from "@/lib/language-context";
import { createSupabaseClient } from "@/lib/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

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

  const labels = {
    home: lang === "es" ? "Inicio" : "Home",
    products: lang === "es" ? "Productos" : "Products",
    about: lang === "es" ? "Sobre Nosotros" : "About",
    faq: lang === "es" ? "Preguntas" : "FAQ",
    contact: lang === "es" ? "Contacto" : "Contact",
    admin_login: lang === "es" ? "Acceso Admin" : "Admin",
  };

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <Link
        href="/"
        onClick={() => setIsOpen(false)}
        className={
          mobile
            ? "block rounded-lg px-3 py-2 text-base hover:bg-muted transition-colors"
            : "hover:text-primary transition-colors"
        }
      >
        {labels.home}
      </Link>

      <Link
        href="/products"
        onClick={() => setIsOpen(false)}
        className={
          mobile
            ? "block rounded-lg px-3 py-2 text-base hover:bg-muted transition-colors"
            : "hover:text-primary transition-colors"
        }
      >
        {labels.products}
      </Link>

      <Link
        href="/about"
        onClick={() => setIsOpen(false)}
        className={
          mobile
            ? "block rounded-lg px-3 py-2 text-base hover:bg-muted transition-colors"
            : "hover:text-primary transition-colors"
        }
      >
        {labels.about}
      </Link>

      <Link
        href="/faq"
        onClick={() => setIsOpen(false)}
        className={
          mobile
            ? "block rounded-lg px-3 py-2 text-base hover:bg-muted transition-colors"
            : "hover:text-primary transition-colors"
        }
      >
        {labels.faq}
      </Link>

      <Link
        href="/contact"
        onClick={() => setIsOpen(false)}
        className={
          mobile
            ? "block rounded-lg px-3 py-2 text-base hover:bg-muted transition-colors"
            : "hover:text-primary transition-colors"
        }
      >
        {labels.contact}
      </Link>

      {isAdmin && (
        <Link
          href="/admin"
          onClick={() => setIsOpen(false)}
          className={
            mobile
              ? "block rounded-lg px-3 py-2 text-base font-semibold hover:bg-muted transition-colors"
              : "font-bold hover:text-primary transition-colors"
          }
        >
          {labels.admin_login}
        </Link>
      )}
    </>
  );

  return (
    <nav className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-3">
        {/* Left: Brand */}
        <Link href="/" className="flex items-center gap-2 min-w-0 shrink-0">
          <div className="font-bold text-primary leading-none text-lg sm:text-xl md:text-2xl truncate">
            baklavavalencia
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <NavLinks />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Desktop language switcher */}
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>

          {/* Cart */}
          <Link href="/cart" aria-label="Cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center p-0 text-xs">
                  {totalItems}
                </Badge>
              )}
            </Button>
          </Link>

          {/* User menu */}
          <UserMenubar lang={lang} />

          {/* Mobile menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-[85vw] max-w-sm p-0">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>

              {/* Header */}
              <div className="p-4 border-b pr-12">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-bold text-primary text-lg truncate">
                    baklavavalencia
                  </div>
                  <LanguageSwitcher />
                </div>
              </div>

              {/* Links */}
              <div className="p-3">
                <nav className="flex flex-col gap-1">
                  <NavLinks mobile />
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
