"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Home, Search, ShoppingBag } from "lucide-react"

export default function NotFound() {
  const searchParams = useSearchParams()
  const lang = (searchParams.get("lang") as "en" | "es") || "es"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-amber-50/20 to-orange-50/30 p-4">
      <Card className="max-w-2xl w-full border-amber-200 shadow-2xl">
        <CardContent className="pt-12 pb-12 text-center">
          {/* Large 404 Number */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
              404
            </h1>
          </div>

          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center">
              <Search className="h-12 w-12 text-amber-600" />
            </div>
          </div>

          {/* Message */}
          <h2 className="text-3xl font-bold mb-4">{lang === "es" ? "Página No Encontrada" : "Page Not Found"}</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            {lang === "es"
              ? "Lo sentimos, la página que buscas no existe o ha sido movida."
              : "Sorry, the page you're looking for doesn't exist or has been moved."}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href={`/?lang=${lang}`}>
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              >
                <Home className="h-5 w-5 mr-2" />
                {lang === "es" ? "Volver al Inicio" : "Go to Home"}
              </Button>
            </Link>
            <Link href={`/products?lang=${lang}`}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                <ShoppingBag className="h-5 w-5 mr-2" />
                {lang === "es" ? "Ver Productos" : "View Products"}
              </Button>
            </Link>
          </div>

          {/* Decorative Elements */}
          <div className="mt-12 pt-8 border-t border-amber-200">
            <p className="text-sm text-muted-foreground">{lang === "es" ? "¿Necesitas ayuda?" : "Need help?"}</p>
            <div className="mt-2 space-x-4">
              <Link href={`/contact?lang=${lang}`} className="text-sm text-primary hover:underline">
                {lang === "es" ? "Contacto" : "Contact"}
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href={`/faq?lang=${lang}`} className="text-sm text-primary hover:underline">
                FAQ
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Background Decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
    </div>
  )
}
