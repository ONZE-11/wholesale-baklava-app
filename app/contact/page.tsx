"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export default function ContactPage() {
  const { lang } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          {lang === "es" ? "Contáctenos" : "Contact Us"}
        </h1>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    {lang === "es" ? "Correo Electrónico" : "Email"}
                  </h3>
                  <a
                    href="mailto:mairesmaster@gmail.com"
                    className="text-primary hover:underline"
                  >
                    mairesmaster@gmail.com
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    {lang === "es" ? "Teléfono" : "Phone"}
                  </h3>
                  <a
                    href="tel:+34601080799"
                    className="text-primary hover:underline"
                  >
                    +34 601 080 799
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    {lang === "es" ? "Dirección" : "Address"}
                  </h3>
                  <p className="text-muted-foreground">
                    Avenida Francia, N45
                    <br />
                    Valencia, España
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Google Maps */}
        <Card>
          <CardContent className="p-0">
            <div className="w-full h-[450px] rounded-lg overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3079.8943751234567!2d-0.3473888!3d39.4597531!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMznCsDI3JzM1LjEiTiAwwrAyMCc1MC42Ilc!5e0!3m2!1sen!2ses!4v1234567890"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={lang === "es" ? "Ubicación de valenciabaklava" : "valenciabaklava Location"}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
