"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/env";
import { supabaseAdmin } from "@/lib/supabase";
import { FormData } from "@/schemas/form";
import { PRICES, type TicketType } from "@/utils/consts";

type GroupedTickets = Record<
  TicketType,
  { quantity: number; price: number; description: string }
>;

export async function handlePaymentAction(data: FormData) {
  let checkoutUrl = "";

  try {
    const origin = (await headers()).get("origin");
    const { buyer, tickets } = data;

    const totalAmount = tickets.reduce(
      (acc, ticket) => acc + PRICES[ticket.type],
      0,
    );

    const { data: existingBuyer } = await supabaseAdmin
      .from("buyers")
      .select("id, email")
      .eq("cpf", buyer.cpf.replace(/\D/g, ""))
      .single();

    if (existingBuyer && existingBuyer.email !== buyer.email) {
      return { error: "Este CPF já está vinculado a outro e-mail." };
    }

    const { data: createdBuyer, error: buyerError } = await supabaseAdmin
      .from("buyers")
      .upsert(
        {
          name: buyer.name,
          email: buyer.email,
          cpf: buyer.cpf.replace(/\D/g, ""),
          phone: buyer.phone.replace(/\D/g, ""),
        },
        { onConflict: "cpf" },
      )
      .select()
      .single();

    if (buyerError || !createdBuyer) {
      console.error("[ACTION] Erro ao salvar comprador:", buyerError?.code);
      return { error: "Erro ao salvar comprador" };
    }

    const { data: createdOrder, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        buyer_id: createdBuyer.id,
        amount: totalAmount,
        status: "pending",
      })
      .select()
      .single();

    if (orderError || !createdOrder) {
      console.error("[ACTION] Erro ao criar pedido:", orderError?.code);
      return { error: "Erro ao salvar pedido" };
    }

    const { error: ticketsError } = await supabaseAdmin.from("tickets").insert(
      tickets.map((ticket) => ({
        order_id: createdOrder.id,
        name: ticket.name,
        type: ticket.type,
        is_member: ticket.isMember,
        nucleo_name: ticket.nucleoName ?? null,
        gluten_intolerant: ticket.glutenIntolerant,
        lactose_intolerant: ticket.lactoseIntolerant,
      })),
    );

    if (ticketsError) {
      console.error("[ACTION] Erro ao salvar tickets:", ticketsError.code);
      return { error: "Erro ao salvar ingressos" };
    }

    const groupedTickets = tickets.reduce((acc, { type }) => {
      if (!acc[type]) {
        acc[type] = {
          quantity: 0,
          price: PRICES[type],
          description: `Ingresso II Show de Massas - ${type.toUpperCase()}`,
        };
      }

      acc[type].quantity += 1;

      return acc;
    }, {} as GroupedTickets);

    const checkoutResponse = await fetch(
      "https://api.infinitepay.io/invoices/public/checkout/links",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          handle: env.INFINITE_PAY_HANDLE,
          order_nsu: createdOrder.id,
          metadata: {
            buyer_id: createdBuyer.id,
            order_id: createdOrder.id,
          },
          items: Object.values(groupedTickets).filter((item) => item.price > 0),
          customer: {
            name: createdBuyer.name,
            email: createdBuyer.email,
            phone_number: createdBuyer.phone,
          },
          redirect_url: `${origin}/sucesso`,
          webhook_url: `${origin}/api/webhooks/infinite-pay`,
        }),
      },
    );

    const checkoutData = await checkoutResponse.json();

    if (!checkoutResponse.ok || !checkoutData.url) {
      console.error(
        "[ACTION] Resposta inválida da API de pagamento",
        checkoutResponse,
      );
      return { error: "Erro ao gerar link de pagamento" };
    }

    checkoutUrl = checkoutData.url;
  } catch (error: unknown) {
    if (isRedirectError(error)) throw error;

    console.error(
      "[ACTION] Erro interno no servidor:",
      error instanceof Error ? error.name : "Unknown",
    );

    return { error: "Falha ao processar pagamento. Tente novamente." };
  }

  redirect(checkoutUrl);
}
