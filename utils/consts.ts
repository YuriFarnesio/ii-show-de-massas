export const TICKET_TYPES = ["adult", "youth", "child"] as const;

export type TicketType = (typeof TICKET_TYPES)[number];

export const PRICES: Record<TicketType, number> = {
  adult: 50,
  youth: 35,
  child: 0,
};

export const TICKET_LABELS: Record<TicketType, string> = {
  adult: "Adulto (acima de 16 anos) - R$ 50",
  youth: "Jovem (12 a 16 anos) - R$ 35",
  child: "Criança - Gratuito",
};

export const NUCLEO_NAMES = [
  "Núcleo Lagoa da Prata",
  "Núcleo Jardim do Mestre",
  "Núcleo Mestre Euclides",
  "Núcleo Rei Rabino",
  "Núcleo Divinópolis",
  "Núcleo Flor de Mariri",
  "Núcleo Rei Salomão",
  "Núcleo Flor Encantador",
  "Núcleo Menino Rei",
] as const;

export type NucleoName = (typeof NUCLEO_NAMES)[number];
