"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import { t } from "@/lib/i18n"

export default function FAQPage() {
  const { lang } = useLanguage() // استفاده از Context

  const faqs = [
    { q: t("faq.q1", lang), a: t("faq.a1", lang) },
    { q: t("faq.q2", lang), a: t("faq.a2", lang) },
    { q: t("faq.q3", lang), a: t("faq.a3", lang) },
    { q: t("faq.q4", lang), a: t("faq.a4", lang) },
    { q: t("faq.q5", lang), a: t("faq.a5", lang) },
    { q: t("faq.q6", lang), a: t("faq.a6", lang) },
    { q: t("faq.q7", lang), a: t("faq.a7", lang) },
    { q: t("faq.q8", lang), a: t("faq.a8", lang) },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8B4513]/10 via-background to-[#D4AF37]/10" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">{t("faq.title", lang)}</h1>
              <p className="text-xl text-muted-foreground text-pretty">{t("faq.subtitle", lang)}</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Card className="max-w-4xl mx-auto">
              <CardContent className="p-6 md:p-8">
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
                      <AccordionTrigger className="text-left hover:no-underline py-4">
                        <span className="font-semibold text-foreground">{faq.q}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-[#8B4513]/10 to-[#D4AF37]/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              {t("faq.still_have_questions", lang)}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              {t("faq.contact_text", lang)}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="https://wa.me/34601080799"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-lg transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp
              </a>
              <a
                href="mailto:mairesmaster@gmail.com"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
              >
                {t("faq.send_email", lang)}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
