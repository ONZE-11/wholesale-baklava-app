"use client";

import Link from "next/link";
import { t } from "@/lib/i18n";
import { Mail, Phone, MapPin, Instagram, Facebook } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export function Footer() {
  const { lang } = useLanguage();

  return (
    <footer className="bg-card border-t mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* برند */}
          <div>
            <h3 className="text-xl font-bold text-primary mb-4">
              baklavavalencia
            </h3>

            <p className="text-muted-foreground mb-4">
              {lang === "es"
                ? "Baklava premium al por mayor desde Valencia, España"
                : "Premium wholesale baklava from Valencia, Spain"}
            </p>

            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/valenciabaklava"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>

              <a
                href="https://www.facebook.com/valenciabaklava"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>

              <a
                href="https://wa.me/34601080799"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
                aria-label="WhatsApp"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                </svg>
              </a>
            </div>
          </div>

          {/* تماس */}
          <div>
            <h4 className="font-semibold mb-4">{t("nav.contact", lang)}</h4>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <a
                  href="mailto:baklavavalencia@gmail.com"
                  className="hover:text-primary"
                >
                  baklavavalencia@gmail.com
                </a>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <a href="tel:+34601080799" className="hover:text-primary">
                  +34 601 080 799
                </a>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p>Avenida Francia, N45</p>
                  <p>Valencia, España</p>
                </div>
              </div>
            </div>
          </div>

          {/* لینک‌ها */}
          <div>
            <h4 className="font-semibold mb-4">
              {lang === "es" ? "Enlaces Rápidos" : "Quick Links"}
            </h4>

            <div className="space-y-2 text-sm">
              <Link href="/" className="block hover:text-primary">
                {t("nav.home", lang)}
              </Link>

              <Link href="/about" className="block hover:text-primary">
                {lang === "es" ? "Sobre Nosotros" : "About Us"}
              </Link>

              <Link href="/products" className="block hover:text-primary">
                {t("nav.products", lang)}
              </Link>

              <Link href="/faq" className="block hover:text-primary">
                {t("nav.faq", lang)}
              </Link>

              <Link href="/contact" className="block hover:text-primary">
                {t("nav.contact", lang)}
              </Link>

              <Link href="/terms" className="block hover:text-primary">
                {lang === "es"
                  ? "Términos y Condiciones"
                  : "Terms & Conditions"}
              </Link>

              <Link href="/privacy" className="block hover:text-primary">
                {lang === "es" ? "Política de Privacidad" : "Privacy Policy"}
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          © 2025 baklavavalencia.{" "}
          {lang === "es"
            ? "Todos los derechos reservados."
            : "All rights reserved."}
        </div>
      </div>
    </footer>
  );
}
