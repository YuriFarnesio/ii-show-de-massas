"use client";

import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  const message =
    "Olá Yuri, estou querendo comprar ingressos para o show de massas";
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/5537999834349?text=${encodedMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-8 right-6 flex items-center justify-center rounded-full bg-[#25D366] p-2 font-bold text-white shadow-2xl transition-all hover:scale-110 hover:bg-[#128C7E] active:scale-95 z-50"
      aria-label="Falar no WhatsApp"
    >
      <MessageCircle className="size-6" />
      <span className="max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap transition-all duration-300 group-hover:ml-2">
        Dúvidas? Fale conosco!
      </span>
    </a>
  );
}
