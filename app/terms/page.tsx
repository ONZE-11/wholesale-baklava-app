"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"

export default function TermsPage() {
  const { lang } = useLanguage()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 bg-gradient-to-br from-background via-amber-50/20 to-orange-50/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 text-center">
            {lang === "es" ? "Términos y Condiciones" : "Terms and Conditions"}
          </h1>

          <Card className="border-amber-200 shadow-lg mb-6">
            <CardHeader>
              <CardTitle>
                {lang === "es" ? "1. Aceptación de Términos" : "1. Acceptance of Terms"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                {lang === "es"
                  ? "Al acceder y utilizar valenciabaklava, usted acepta estar sujeto a estos términos y condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios."
                  : "By accessing and using valenciabaklava, you agree to be bound by these terms and conditions. If you disagree with any part of these terms, you should not use our services."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-lg mb-6">
            <CardHeader>
              <CardTitle>
                {lang === "es" ? "2. Registro de Cuenta B2B" : "2. B2B Account Registration"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                {lang === "es"
                  ? "Nuestros servicios están disponibles exclusivamente para empresas verificadas. Al registrarse, usted declara que:"
                  : "Our services are available exclusively to verified businesses. By registering, you represent that:"}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  {lang === "es"
                    ? "Es un representante autorizado de una empresa legítima"
                    : "You are an authorized representative of a legitimate business"}
                </li>
                <li>
                  {lang === "es"
                    ? "Toda la información proporcionada es precisa y completa"
                    : "All information provided is accurate and complete"}
                </li>
                <li>
                  {lang === "es"
                    ? "Tiene autoridad para vincular a su empresa a estos términos"
                    : "You have authority to bind your company to these terms"}
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-lg mb-6">
            <CardHeader>
              <CardTitle>
                {lang === "es" ? "3. Precios y Pedidos" : "3. Pricing and Orders"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                {lang === "es"
                  ? "Los precios están disponibles solo para cuentas aprobadas. Los pedidos están sujetos a:"
                  : "Pricing is available only to approved accounts. Orders are subject to:"}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  {lang === "es"
                    ? "Cantidades mínimas de pedido según se especifica por producto"
                    : "Minimum order quantities as specified per product"}
                </li>
                <li>{lang === "es" ? "Disponibilidad de stock" : "Stock availability"}</li>
                <li>
                  {lang === "es"
                    ? "Verificación de pago antes del envío"
                    : "Payment verification before shipping"}
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-lg mb-6">
            <CardHeader>
              <CardTitle>
                {lang === "es" ? "4. Pago y Facturación" : "4. Payment and Billing"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                {lang === "es"
                  ? "Aceptamos pagos en línea a través de Stripe y pago contra entrega para clientes establecidos. Todos los precios están en euros (€) e incluyen IVA."
                  : "We accept online payments via Stripe and cash on delivery for established customers. All prices are in euros (€) and include VAT."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-lg mb-6">
            <CardHeader>
              <CardTitle>
                {lang === "es" ? "5. Envío y Entrega" : "5. Shipping and Delivery"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                {lang === "es"
                  ? "Los plazos de entrega varían según la ubicación. Hacemos todo lo posible para cumplir con las fechas de entrega estimadas, pero no somos responsables de retrasos causados por circunstancias fuera de nuestro control."
                  : "Delivery times vary by location. We make every effort to meet estimated delivery dates but are not responsible for delays caused by circumstances beyond our control."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-lg mb-6">
            <CardHeader>
              <CardTitle>
                {lang === "es" ? "6. Cancelaciones y Devoluciones" : "6. Cancellations and Returns"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                {lang === "es"
                  ? "Los pedidos pueden modificarse o cancelarse dentro de las 24 horas posteriores a su realización. Debido a la naturaleza perecedera de nuestros productos, no aceptamos devoluciones excepto en caso de productos defectuosos o dañados."
                  : "Orders may be modified or cancelled within 24 hours of placement. Due to the perishable nature of our products, we do not accept returns except in cases of defective or damaged products."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-lg mb-6">
            <CardHeader>
              <CardTitle>
                {lang === "es" ? "7. Calidad del Producto" : "7. Product Quality"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                {lang === "es"
                  ? "Garantizamos que todos nuestros productos cumplen con los más altos estándares de calidad y seguridad alimentaria. Si no está satisfecho con la calidad, contáctenos dentro de las 48 horas posteriores a la entrega."
                  : "We guarantee that all our products meet the highest standards of quality and food safety. If you are not satisfied with the quality, contact us within 48 hours of delivery."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-lg mb-6">
            <CardHeader>
              <CardTitle>
                {lang === "es" ? "8. Limitación de Responsabilidad" : "8. Limitation of Liability"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                {lang === "es"
                  ? "valenciabaklava no será responsable de daños indirectos, incidentales, especiales o consecuentes que resulten del uso o la imposibilidad de usar nuestros servicios."
                  : "valenciabaklava shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our services."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-lg mb-6">
            <CardHeader>
              <CardTitle>
                {lang === "es" ? "9. Modificaciones de Términos" : "9. Modifications to Terms"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                {lang === "es"
                  ? "Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en nuestro sitio web."
                  : "We reserve the right to modify these terms at any time. Changes will take effect immediately upon posting to our website."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-lg">
            <CardHeader>
              <CardTitle>{lang === "es" ? "10. Contacto" : "10. Contact"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                {lang === "es"
                  ? "Para cualquier pregunta sobre estos términos, contáctenos en:"
                  : "For any questions about these terms, contact us at:"}
              </p>
              <p>
                Email:{" "}
                <a href="mailto:mairesmaster@gmail.com" className="text-primary hover:underline">
                  mairesmaster@gmail.com
                </a>
              </p>
              <p>
                {lang === "es" ? "Teléfono:" : "Phone:"}{" "}
                <a href="tel:+34601080799" className="text-primary hover:underline">
                  +34 601 080 799
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
