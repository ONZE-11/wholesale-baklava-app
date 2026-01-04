"use client";

import Link from "next/link";
import { User } from "lucide-react";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
} from "@/components/ui/menubar";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";

export function UserMenubar({ lang }: { lang: string }) {
  const supabase = createSupabaseClient();
  const safeLang: "en" | "es" = lang === "es" ? "es" : "en";

  const [user, setUser] = useState<any | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;

      if (!mounted) return;
      setUser(sessionUser);

      if (!sessionUser) return;

      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("auth_id", sessionUser.id)
        .single();

      if (mounted && userData?.role === "admin") {
        setIsAdmin(true);
      }
    }

    loadUser();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  // loading
  if (user === undefined) {
    return <div className="w-5 h-5 rounded-full bg-gray-300 animate-pulse" />;
  }

  // not logged in
  if (!user) {
    return (
      <Link href={`/login?lang=${safeLang}`}>
        <User className="h-5 w-5 cursor-pointer" />
      </Link>
    );
  }

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger asChild>
          <div className="h-8 w-8 flex items-center justify-center">
            <User className="h-full w-full cursor-pointer" />
          </div>
        </MenubarTrigger>

        <MenubarContent align="end">
          {isAdmin && (
            <MenubarItem asChild>
              <Link href={`/admin?lang=${safeLang}`}>
                {t("nav.admin", safeLang)}
              </Link>
            </MenubarItem>
          )}

          <MenubarItem asChild>
            <Link href={`/dashboard?lang=${safeLang}`}>
              {t("nav.dashboard", safeLang)}
            </Link>
          </MenubarItem>

          <MenubarItem asChild>
            <Link href={`/dashboard/orders?lang=${safeLang}`}>
              {t("nav.orders", safeLang)}
            </Link>
          </MenubarItem>

          <MenubarSeparator />

          <MenubarItem
            variant="destructive"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = `/?lang=${safeLang}`;
            }}
          >
            {t("nav.logout", safeLang)}
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
