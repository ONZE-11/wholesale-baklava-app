"use client"
export const dynamic = "force-dynamic";

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const lang = (searchParams.get("lang") as "en" | "es") || "es"
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // این useEffect فقط برای هدایت به صفحه اصلی برای ادمین وارد شده است
  useEffect(() => {
    const checkAdminSession = async () => {
      const res = await fetch("/api/admin/session"); // endpoint برای بررسی session ادمین
      if (res.ok) {
        const data = await res.json();
        if (data.user && data.user.role === "admin") {
          router.push(`/admin?lang=${lang}`); // هدایت به صفحه ادمین اگر کاربر وارد شده باشد
        }
      }
    }
    checkAdminSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      let data: any
      try {
        data = await res.json()
      } catch {
        data = { error: "Invalid response from server" }
      }

      if (!res.ok) {
        toast({
          title: lang === "es" ? "Error" : "Error",
          description:
            data.error || (lang === "es" ? "Credenciales inválidas" : "Invalid credentials"),
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // لاگین موفقیت‌آمیز
      toast({
        title: lang === "es" ? "Éxito" : "Success",
        description: lang === "es" ? "Sesión iniciada" : "Logged in successfully",
      })

      // هدایت به صفحه ادمین
      router.push(`/admin?lang=${lang}`)
    } catch (error) {
      console.error("[v0] Admin login error:", error)
      toast({
        title: lang === "es" ? "Error" : "Error",
        description: lang === "es" ? "No se pudo iniciar sesión" : "Could not log in",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">
            {lang === "es" ? "Acceso de Administrador" : "Admin Login"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{lang === "es" ? "Correo Electrónico" : "Email"}</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{lang === "es" ? "Contraseña" : "Password"}</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (lang === "es" ? "Cargando..." : "Loading...") : lang === "es" ? "Iniciar Sesión" : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
