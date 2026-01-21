import z from "zod";

import { TICKET_TYPES } from "@/utils/consts";
import { validateCPF } from "@/utils/functions";

export const buyerSchema = z.object({
  name: z.string().trim().min(1, "Nome Completo é obrigatório"),
  email: z.email("E-mail inválido").trim().min(1, "E-mail é obrigatório"),
  cpf: z
    .string()
    .min(1, "CPF é obrigatório")
    .refine((value) => validateCPF(value), {
      message: "CPF inválido",
    }),
  phone: z
    .string()
    .min(1, "Telefone é obrigatório")
    .regex(/^\([1-9]{2}\) 9\d{4}-\d{4}$/, "Telefone inválido"),
});

export type BuyerData = z.infer<typeof buyerSchema>;

export const ticketSchema = z
  .object({
    name: z.string().trim().min(1, "Nome Completo é obrigatório"),
    type: z.enum(TICKET_TYPES, {
      error: "Tipo de Ingresso é obrigatório",
    }),
    isMember: z.boolean(),
    nucleoName: z.string().optional(),
    glutenIntolerant: z.boolean(),
    lactoseIntolerant: z.boolean(),
  })
  .refine(
    ({ isMember, nucleoName }) => {
      if (!isMember) return true;
      return !!nucleoName && nucleoName.trim().length > 0;
    },
    {
      message: "Nome do Núcleo é obrigatório",
      path: ["nucleoName"],
    },
  );

export type TicketData = z.infer<typeof ticketSchema>;

export const formSchema = z.object({
  buyer: buyerSchema,
  tickets: z.array(ticketSchema).min(1, "Adicione pelo menos um ingresso"),
});

export type FormData = z.infer<typeof formSchema>;
