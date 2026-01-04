"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "es";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
};

const LanguageContext = createContext<Ctx>({
  lang: "es",
  setLang: () => {},
});

const STORAGE_KEY = "app_lang";

function normalizeLang(v: string | null): Lang {
  return v === "en" ? "en" : "es";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  // init from localStorage (one time)
  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (saved) setLangState(normalizeLang(saved));
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
    }
  };

  const value = useMemo(() => ({ lang, setLang }), [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
