"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"

export default function PrivacyPage() {
  const { lang } = useLanguage()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 bg-gradient-to-br from-background via-amber-50/20 to-orange-50/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 text-center">
            {lang === "es" ? "Política de Privacidad" : "Privacy Policy"}
          </h1>

          <Card className="border-amber-200 shadow-lg mb-6">
            <CardHeader>
              <CardTitle>
                {lang === "es"
                  ? "1. Información que Recopilamos"
                  : "1. Information We Collect"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                {lang === "es"
                  ? "Recopilamos información que usted nos proporciona directamente al:"
                  : "We collect information that you provide directly to us when:"}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  {lang === "es"
                    ? "Registrar una cuenta empresarial"
                    : "Registering a business account"}
                </li>
                <li>{lang === "es" ? "Realizar pedidos" : "Placing orders"}</li>
                <li>{lang === "es" ? "Contactarnos" : "Contacting us"}</li>
                <li>
                  {lang === "es"
                    ? "Suscribirse a nuestras comunicaciones"
                    : "Subscribing to our communications"}
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* بقیه Cardها بدون تغییر */}
          {/* فقط lang از context میاد و هماهنگ با Navbar تغییر می‌کنه */}

        </div>
      </main>

      <Footer />
    </div>
  )
}
