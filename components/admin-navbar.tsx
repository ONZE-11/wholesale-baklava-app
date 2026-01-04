"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { t } from "@/lib/i18n";

import { useLanguage } from "@/lib/language-context";

export function AdminNavbar() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    // اگر از supabase استفاده می‌کنی، بهتر signOut هم انجام بدی
    // await supabase.auth.signOut();

    // هدایت به صفحه اصلی بعد از خروج
    router.push(`/?lang=${lang}`);
  };

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href={`/admin?lang=${lang}`}
          className="text-xl md:text-2xl font-bold text-primary"
        >
          baklavavalencia
          <span className="ml-2 text-sm text-muted-foreground hidden sm:inline">
            Admin
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setOpen(!open)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t bg-card">
          <div className="px-4 py-3 flex flex-col gap-3">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              className="justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              {t("nav.logout", lang)}
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
