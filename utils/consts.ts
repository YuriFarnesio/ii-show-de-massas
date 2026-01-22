export const TICKET_TYPES = ["inteira", "juvenil", "infantil"] as const;

export type TicketType = (typeof TICKET_TYPES)[number];

export const PRICES: Record<TicketType, number> = {
  inteira: 5000,
  juvenil: 3500,
  infantil: 0,
};

export const TICKET_LABELS: Record<TicketType, string> = {
  inteira: "Adulto (acima de 16 anos) - R$ 50",
  juvenil: "Jovem (12 a 16 anos) - R$ 35",
  infantil: "Criança - Gratuito",
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
