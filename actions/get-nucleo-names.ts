"use server";

import { supabaseAdmin } from "@/lib/supabase";

export async function getNucleoNames(): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("tickets")
      .select("nucleo_name")
      .not("nucleo_name", "is", null);

    if (error) {
      console.log("Error fetching nucleo names:", error);
      return [];
    }

    const uniqueNames = data
      .map(({ nucleo_name }) => {
        if (!!nucleo_name && nucleo_name.trim() !== "") return nucleo_name;
        return null;
      })
      .filter(Boolean) as string[];

    return uniqueNames;
  } catch (error) {
    console.log("Unexpected error fetching nucleo names:", error);
    return [];
  }
}
