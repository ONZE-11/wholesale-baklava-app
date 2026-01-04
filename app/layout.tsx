import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

import { CartProvider } from "@/lib/cart-context";
import { LanguageProvider } from "@/lib/language-context";
import { WhatsAppButton } from "@/components/whatsapp-button";


const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "valenciabaklava - Premium Wholesale Baklava",
  description: "Premium wholesale baklava from Valencia, Spain. Authentic Mediterranean sweetness for your business.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <LanguageProvider>
          <CartProvider>
            {children}
            <WhatsAppButton />
            <Analytics />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
