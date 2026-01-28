"use server";

import { env } from "@/env";
import { supabaseAdmin } from "@/lib/supabase";
import { sendPaidOrderConfirmationEmail } from "@/utils/emails";

interface InfinitePayCheckResponse {
  success: boolean;
  paid: boolean;
  amount: number;
  paid_amount: number;
  installments: number;
  capture_method: string;
}

export interface VerifyPaymentResult {
  paid: boolean;
  error?: string;
}

export async function verifyPaymentAction(
  order_nsu: string,
  transaction_nsu: string,
  receipt_url: string,
  slug: string,
): Promise<VerifyPaymentResult> {
  try {
    if (transaction_nsu === "free" && slug === "free") {
      console.log(
        `[ACTION] Verificação de pedido gratuito. Order NSU: ${order_nsu}`,
      );
      return { paid: true };
    }

    const { data: currentOrder, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("status")
      .eq("id", order_nsu)
      .single();

    if (orderError || !currentOrder) {
      console.error(`[ACTION] Pedido não encontrado. Order NSU: ${order_nsu}`);
      return { paid: false, error: "Erro ao buscar pedido" };
    }

    const response = await fetch(
      "https://api.infinitepay.io/invoices/public/checkout/payment_check",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: env.INFINITE_PAY_HANDLE,
          order_nsu,
          transaction_nsu,
          slug,
        }),
      },
    );

    const data: InfinitePayCheckResponse = await response.json();

    if (!response.ok) {
      console.error(
        "[ACTION] Resposta inválida da API de verificação status",
        data,
      );
      return { paid: false, error: "Erro ao verificar status" };
    }

    if (data.paid && currentOrder.status !== "paid") {
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          status: "paid",
          external_id: transaction_nsu,
          invoice_slug: slug,
          receipt_url: receipt_url,
          payment_method: data.capture_method,
          installments: data.installments,
          amount: data.amount,
          paid_amount: data.paid_amount,
        })
        .eq("id", order_nsu);

      if (updateError) {
        console.error(
          `[ACTION] Erro ao atualizar pedido. Order NSU: ${order_nsu}`,
        );
      } else {
        console.log(`[ACTION] Pedido atualizado. Order NSU: ${order_nsu}`);

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
            `[ACTION] Erro ao buscar dados para e-mail. Order NSU: ${order_nsu}`,
          );
        } else {
          await sendPaidOrderConfirmationEmail(orderData);
        }
      }
    }

    return { paid: data.paid === true };
  } catch (error) {
    console.error(
      "[ACTION] Erro ao verificar pagamento:",
      error instanceof Error ? error.name : "Unknown",
    );
    return { paid: false, error: "Não foi possível verificar o status." };
  }
}
