import { sendEmailAction } from "@/actions/send-email";
import type { Database } from "@/database.types";

type Buyer = Database["public"]["Tables"]["buyers"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];
type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

type PaidOrderConfirmationDetails = Pick<Order, "paid_amount" | "amount"> & {
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

export async function sendPaidOrderConfirmationEmail(
  orderData: PaidOrderConfirmationDetails,
) {
  const buyerName = orderData.buyers.name;

  const to = orderData.buyers.email;
  const subject = `Confirmação de Pedido: II Show de Massas - ${buyerName}`;

  const amount = orderData.paid_amount ?? orderData.amount;
  const formattedAmount = (amount / 100).toFixed(2).replace(".", ",");

  const ticketsSummary = orderData.tickets.map((ticket) => {
    const info = [];
    if (ticket.is_member) info.push(`Socio: ${ticket.nucleo_name}`);
    if (ticket.gluten_intolerant) info.push("Sem Glúten");
    if (ticket.lactose_intolerant) info.push("Sem Lactose");
    return `${ticket.name} (${ticket.type.toUpperCase()}${info.length > 0 ? " - " + info.join(", ") : ""})`;
  });

  const text = `
    Olá ${buyerName}, seu pagamento para o II Show de Massas foi confirmado!

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
type FreeOrderConfirmationDetails = {
  buyer: Buyer;
  tickets: Ticket[];
};

export async function sendFreeOrderConfirmationEmail({
  buyer,
  tickets,
}: FreeOrderConfirmationDetails) {
  const buyerName = buyer.name;

  const to = buyer.email;
  const subject = `Confirmação de Inscrição: II Show de Massas - ${buyerName}`;

  const ticketsSummary = tickets.map((ticket) => {
    const info = [];
    if (ticket.is_member) info.push(`Sócio: ${ticket.nucleo_name}`);
    if (ticket.gluten_intolerant) info.push("Sem Glúten");
    if (ticket.lactose_intolerant) info.push("Sem Lactose");
    return `${ticket.name} (${ticket.type.toUpperCase()}${info.length > 0 ? " - " + info.join(", ") : ""})`;
  });

  const text = `
    Olá ${buyerName}, sua inscrição para o II Show de Massas foi confirmada!

    Resumo da Inscrição:
    ${ticketsSummary.join("\n")}

    Inscrição Gratuita

    Apresente este e-mail na recepção.
    Data: 14 de Fevereiro, 2026 as 20h.
  `.trim();

  const ticketsHtml = tickets
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
        <h2 style="color: #c2410c; margin: 0;">Inscrição Confirmada</h2>
      </div>
      <div style="padding: 24px;">
        <p>Olá, <strong>${buyer.name}</strong>!</p>
        <p>Sua inscrição gratuita foi confirmada. Abaixo estão os detalhes dos seus ingressos:</p>

        <div style="margin: 24px 0; border: 1px solid #eee; border-radius: 8px;">
          ${ticketsHtml}
        </div>

        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #666;">Inscrição</p>
          <p style="margin: 4px 0 0; font-size: 20px; font-weight: bold; color: #c2410c;">
            GRATUITA
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
