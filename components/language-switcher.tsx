"use client"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()

  return (
    <div className="flex gap-2">
      <Button
        variant={lang === "es" ? "default" : "outline"}
        size="sm"
        onClick={() => setLang("es")}
      >
        ES
      </Button>
      <Button
        variant={lang === "en" ? "default" : "outline"}
        size="sm"
        onClick={() => setLang("en")}
      >
        EN
      </Button>
    </div>
  )
}
