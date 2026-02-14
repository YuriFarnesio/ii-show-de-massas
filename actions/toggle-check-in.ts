"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function toggleCheckIn(
  ticketId: string,
  checkedIn: boolean,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from("tickets")
    .update({ checked_in: checkedIn })
    .eq("id", ticketId);

  if (error) {
    console.error("Error toggling check-in:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/acessos");
  return { success: true };
}
