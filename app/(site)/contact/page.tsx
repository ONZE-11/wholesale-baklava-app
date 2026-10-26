"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

const ADDRESS =
  "Carrer de València, 125, 46900 Torrent, València, Spain";

const MAP_URL =
  `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS)}&z=18&output=embed`;

const DIRECTIONS_URL =
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ADDRESS)}`;

export default function ContactPage() {
  const { lang } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">

        {/* Page Title */}
        <h1 className="text-4xl font-bold mb-8 text-center">
          {lang === "es" ? "Contáctenos" : "Contact Us"}
        </h1>

        {/* Contact Information */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">

          {/* Email */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">

                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="h-6 w-6 text-primary" />
                </div>

                <div className="min-w-0">
                  <h3 className="font-semibold mb-2">
                    {lang === "es"
                      ? "Correo Electrónico"
                      : "Email"}
                  </h3>

                  <a
                    href="mailto:baklavavalencia@gmail.com"
                    className="text-primary hover:underline break-all"
                  >
                    baklavavalencia@gmail.com
                  </a>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Phone Numbers */}
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

                  <div className="flex flex-col gap-2">

                    {/* First Phone */}
                    <a
                      href="tel:+34614546325"
                      className="text-primary hover:underline"
                    >
                      +34 614 546 325
                    </a>

                    {/* Second Phone */}
                    <a
                      href="tel:+34601080799"
                      className="text-primary hover:underline"
                    >
                      +34 601 080 799
                    </a>

                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Address */}
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
                    Carrer de València, 125
                    <br />
                    46900 Torrent, València
                    <br />
                    {lang === "es" ? "España" : "Spain"}
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
                src={MAP_URL}
                width="100%"
                height="450"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={
                  lang === "es"
                    ? "Ubicación de Baklava Valencia"
                    : "Baklava Valencia Location"
                }
                className="w-full h-full"
              />

            </div>

            {/* Directions Button */}
            <div className="p-4 text-center">

              <a
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                <MapPin className="h-4 w-4" />

                {lang === "es"
                  ? "Cómo llegar"
                  : "Get Directions"}
              </a>

            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}