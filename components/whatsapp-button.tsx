"use client"

import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/34601080799"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50"
      aria-label="Contact us on WhatsApp"
    >
      <Button
        size="lg"
        className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-[#25D366] hover:bg-[#20BA5A]"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>
    </a>
  )
}
