"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/env";
import { supabaseAdmin } from "@/lib/supabase";
import { FormData } from "@/schemas/form";
import { PRICES, type TicketType } from "@/utils/consts";
import { sendFreeOrderConfirmationEmail } from "@/utils/emails";

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

    const cpfClean = buyer.cpf.replace(/\D/g, "");
    const emailClean = buyer.email.toLowerCase().trim();
    const phoneClean = buyer.phone.replace(/\D/g, "");

    const { data: createdBuyer, error: buyerError } = await supabaseAdmin
      .from("buyers")
      .upsert(
        {
          name: buyer.name,
          email: emailClean,
          cpf: cpfClean,
          phone: phoneClean,
        },
        { onConflict: "email,cpf" },
      )
      .select()
      .single();

    if (buyerError || !createdBuyer) {
      console.error(
        "[ACTION] Erro ao salvar comprador:",
        buyer,
        buyerError?.message,
      );
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
      console.error("[ACTION] Erro ao criar pedido:", orderError?.message);
      return { error: "Erro ao salvar pedido" };
    }

    const { data: createdTickets, error: ticketsError } = await supabaseAdmin
      .from("tickets")
      .insert(
        tickets.map((ticket) => ({
          order_id: createdOrder.id,
          name: ticket.name,
          type: ticket.type,
          is_member: ticket.isMember,
          nucleo_name: ticket.nucleoName || null,
          gluten_intolerant: ticket.glutenIntolerant,
          lactose_intolerant: ticket.lactoseIntolerant,
        })),
      )
      .select();

    if (ticketsError || !createdTickets) {
      console.error("[ACTION] Erro ao salvar tickets:", ticketsError?.message);
      return { error: "Erro ao salvar ingressos" };
    }

    if (totalAmount === 0) {
      const { error: updateOrderError } = await supabaseAdmin
        .from("orders")
        .update({
          status: "paid",
          payment_method: "free",
          amount: 0,
          paid_amount: 0,
        })
        .eq("id", createdOrder.id);

      if (updateOrderError) {
        console.error(
          `[ACTION] Erro ao atualizar status do pedido gratuito. Order ID: ${createdOrder.id}`,
          updateOrderError.message,
        );
        return { error: "Erro ao processar inscrição gratuita" };
      }

      console.log(
        `[ACTION] Pedido gratuito confirmado. Order ID: ${createdOrder.id}`,
      );

      await sendFreeOrderConfirmationEmail({
        buyer: createdBuyer,
        tickets: createdTickets,
      });

      checkoutUrl = `${origin}/sucesso?order_nsu=${createdOrder.id}&transaction_nsu=free&receipt_url=free&slug=free`;
    } else {
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

      const items = Object.values(groupedTickets).filter(
        (item) => item.price > 0,
      );

      const freeTickets = Object.values(groupedTickets).filter(
        (item) => item.price === 0,
      );

      if (freeTickets.length > 0) {
        const freeTicketsNames = freeTickets
          .map((ticket) => `${ticket.quantity}x ${ticket.description}`)
          .join(", ");
        items[0].description += ` + ${freeTicketsNames}`;
      }

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
            items: items,
            customer: {
              name: createdBuyer.name,
              email: createdBuyer.email,
              cpf: createdBuyer.cpf,
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
          checkoutData.message,
        );
        return { error: "Erro ao gerar link de pagamento" };
      }

      checkoutUrl = checkoutData.url;
    }
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
