import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/env";
import { supabaseAdmin } from "@/lib/supabase";
import { sendPaidOrderConfirmationEmail } from "@/utils/emails";

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

    await sendPaidOrderConfirmationEmail(orderData);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error(
      "[Webhook] Erro crítico:",
      error instanceof Error ? error.name : "Unknown",
    );
    return NextResponse.json({ error: "Erro interno" }, { status: 400 });
  }
}
