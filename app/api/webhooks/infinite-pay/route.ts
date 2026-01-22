import { type NextRequest, NextResponse } from "next/server";

import { sendEmailAction } from "@/actions/send-email";
import type { Database } from "@/database.types";
import { env } from "@/env";
import { supabaseAdmin } from "@/lib/supabase";

type Buyer = Database["public"]["Tables"]["buyers"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];
type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

type OrderWithDetails = Pick<Order, "paid_amount" | "amount"> & {
  buyers: Pick<Buyer, "name" | "email">;
  tickets: Array<
    Pick<
      Ticket,
      | "name"
      | "type"
      | "is_member"
      | "nucleo_name"
      | "gluten_intolerant"
      | "lactose_intolerant"
    >
  >;
};

interface InfinitePayWebhookPayload {
  invoice_slug: string;
  amount: number;
  paid_amount: number;
  installments: number;
  capture_method: string;
  transaction_nsu: string;
  order_nsu: string;
  receipt_url: string;
  items: Array<{
    description: string;
    quantity: number;
    price: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: InfinitePayWebhookPayload = await request.json();

    const {
      order_nsu,
      transaction_nsu,
      invoice_slug,
      receipt_url,
      capture_method,
      installments,
      amount,
      paid_amount,
    } = body;

    console.log(
      `[Webhook] Processando pagamento aprovado. Order NSU: ${order_nsu}`,
    );

    if (!order_nsu) {
      return NextResponse.json(
        { error: "Order NSU ausente no payload" },
        { status: 400 },
      );
    }

    const { data: currentOrder, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("status")
      .eq("id", order_nsu)
      .single();

    if (orderError || !currentOrder) {
      console.warn(`[Webhook] Pedido não encontrado. Order NSU: ${order_nsu}`);
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 400 },
      );
    }

    if (currentOrder.status === "paid") {
      console.log(`[Webhook] Pagamento já processado. Order NSU: ${order_nsu}`);
      return NextResponse.json(
        { success: true, message: "Pagamento já processado" },
        { status: 200 },
      );
    }

    const checkResponse = await fetch(
      "https://api.infinitepay.io/invoices/public/checkout/payment_check",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: env.INFINITE_PAY_HANDLE,
          order_nsu,
          transaction_nsu,
          slug: invoice_slug,
        }),
      },
    );

    if (!checkResponse.ok) {
      console.error(
        `[Webhook] Erro na verificação com operadora: ${checkResponse.status}`,
      );
      return NextResponse.json(
        { error: "Erro ao verificar pagamento na operadora" },
        { status: 400 },
      );
    }

    const paymentStatus = await checkResponse.json();

    if (!paymentStatus.success || !paymentStatus.paid) {
      console.warn(
        `[Webhook] Tentativa de confirmação inválida. Order NSU: ${order_nsu}`,
      );
      return NextResponse.json(
        { error: "Pagamento não confirmado na operadora" },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
        external_id: transaction_nsu,
        invoice_slug: invoice_slug,
        receipt_url: receipt_url,
        payment_method: capture_method,
        installments: installments,
        amount: amount,
        paid_amount: paid_amount,
      })
      .eq("id", order_nsu);

    if (updateError) {
      console.error(
        `[Webhook] Erro ao atualizar pedido. Order NSU: ${order_nsu}`,
      );
      return NextResponse.json(
        { error: "Erro ao atualizar pedido" },
        { status: 400 },
      );
    }

    console.log(`[Webhook] Pedido atualizado. Order NSU: ${order_nsu}`);

    const { data: orderData, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select(
        `
          amount,
          paid_amount,
          buyers (name, email),
          tickets (name, type, is_member, nucleo_name, gluten_intolerant, lactose_intolerant)
        `,
      )
      .eq("id", order_nsu)
      .single();

    if (fetchError || !orderData) {
      console.error(
        `[Webhook] Erro ao buscar dados para e-mail. Order NSU: ${order_nsu}`,
      );
      return NextResponse.json({
        success: true,
        warning: "Pago, mas e-mail não enviado",
      });
    }

    await sendConfirmationEmail(orderData);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error(
      "[Webhook] Erro crítico:",
      error instanceof Error ? error.name : "Unknown",
    );
    return NextResponse.json({ error: "Erro interno" }, { status: 400 });
  }
}

async function sendConfirmationEmail(orderData: OrderWithDetails) {
  const buyerName = orderData.buyers.name;

  const to = orderData.buyers.email;
  const subject = `Confirmacao de Pedido: II Show de Massas - ${buyerName}`;

  const amount = orderData.paid_amount ?? orderData.amount;
  const formattedAmount = (amount / 100).toFixed(2).replace(".", ",");

  const ticketsSummary = orderData.tickets.map((ticket) => {
    const info = [];
    if (ticket.is_member) info.push(`Socio: ${ticket.nucleo_name}`);
    if (ticket.gluten_intolerant) info.push("Sem Gluten");
    if (ticket.lactose_intolerant) info.push("Sem Lactose");
    return `${ticket.name} (${ticket.type.toUpperCase()}${info.length > 0 ? " - " + info.join(", ") : ""})`;
  });

  const text = `
    Ola ${buyerName}, seu pagamento para o II Show de Massas foi confirmado!

    Resumo da Compra:
    ${ticketsSummary.join("\n")}

    Total Pago: ${formattedAmount}

    Apresente este e-mail na recepção.
    Data: 14 de Fevereiro, 2026 as 20h.
  `.trim();

  const ticketsHtml = orderData.tickets
    .map((ticket) => {
      const info = [];
      if (ticket.is_member) info.push(`Sócio: ${ticket.nucleo_name}`);
      if (ticket.gluten_intolerant) info.push("Sem Glúten");
      if (ticket.lactose_intolerant) info.push("Sem Lactose");

      return `
      <div style="padding: 12px; border-bottom: 1px solid #eee;">
        <p style="margin: 0; font-weight: bold; color: #333;">${ticket.name}</p>
        <p style="margin: 4px 0 0; font-size: 12px; color: #666;">
          Tipo: ${ticket.type.toUpperCase()} ${info.length > 0 ? `| ${info.join(" | ")}` : ""}
        </p>
      </div>
    `;
    })
    .join("");

  const html = `
    <div
      style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
      <div style="background: #f4f4f5; padding: 24px; border-radius: 8px 8px 0 0; text-align: center; border-bottom: 3px solid #c2410c;">
        <h2 style="color: #c2410c; margin: 0;">Pagamento Confirmado</h2>
      </div>
      <div style="padding: 24px;">
        <p>Olá, <strong>${orderData.buyers.name}</strong>!</p>
        <p>Recebemos a confirmação do seu pagamento. Abaixo estão os detalhes dos seus ingressos:</p>

        <div style="margin: 24px 0; border: 1px solid #eee; border-radius: 8px;">
          ${ticketsHtml}
        </div>

        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #666;">Total Pago</p>
          <p style="margin: 4px 0 0; font-size: 20px; font-weight: bold; color: #c2410c;">
            R$ ${formattedAmount}
          </p>
        </div>

        <p style="margin-top: 24px; font-size: 14px; color: #666; text-align: center;">
          Apresente este e-mail na recepção do evento.<br>
          <strong>Data:</strong> 14 de Fevereiro, 2026 às 20h
        </p>
      </div>
    </div>
  `;

  await sendEmailAction(to, subject, html, text);
}
