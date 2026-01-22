"use server";

import { env } from "@/env";

export async function verifyPaymentAction(
  order_nsu: string,
  transaction_nsu: string,
  slug: string,
) {
  try {
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

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "[ACTION] Resposta inválida da API de verificação status",
        response,
      );
      return { error: "Erro ao verificar status" };
    }

    return {
      paid: data.paid === true,
      amount: data.amount,
      method: data.capture_method,
    };
  } catch (error) {
    console.error(
      "[ACTION] Erro ao verificar pagamento:",
      error instanceof Error ? error.name : "Unknown",
    );
    return { paid: false, error: "Não foi possível verificar o status." };
  }
}
