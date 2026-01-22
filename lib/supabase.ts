import type { Database } from "@/database.types";
import { env } from "@/env";
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
);
