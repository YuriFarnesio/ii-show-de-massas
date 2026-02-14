"use server";

import { supabaseAdmin } from "@/lib/supabase";
import type { TicketType } from "@/utils/consts";

export type TicketWithBuyer = {
  id: string;
  name: string;
  type: TicketType;
  is_member: boolean;
  nucleo_name: string | null;
  checked_in: boolean;
  gluten_intolerant: boolean;
  lactose_intolerant: boolean;
  created_at: string;
  buyer_name: string;
  order_status: string | null;
};

export async function getTickets(): Promise<TicketWithBuyer[]> {
  const { data, error } = await supabaseAdmin
    .from("tickets")
    .select(
      `
      id,
      name,
      type,
      is_member,
      nucleo_name,
      checked_in,
      gluten_intolerant,
      lactose_intolerant,
      created_at,
      orders!inner (
        status,
        buyers!inner (
          name
        )
      )
    `,
    )
    .eq("orders.status", "paid")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching tickets:", error);
    return [];
  }

  return (data ?? []).map((ticket) => {
    const order = ticket.orders as {
      status: string | null;
      buyers: { name: string };
    };

    return {
      id: ticket.id,
      name: ticket.name,
      type: ticket.type as TicketType,
      is_member: ticket.is_member,
      nucleo_name: ticket.nucleo_name,
      checked_in: ticket.checked_in,
      gluten_intolerant: ticket.gluten_intolerant,
      lactose_intolerant: ticket.lactose_intolerant,
      created_at: ticket.created_at,
      buyer_name: order.buyers.name,
      order_status: order.status,
    };
  });
}
