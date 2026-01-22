import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string(),
  SUPABASE_SECRET_KEY: z.string(),
  SUPABASE_PASSWORD: z.string(),
  INFINITE_PAY_HANDLE: z.string(),
  SMTP_EMAIL: z.string(),
  SMTP_PASS: z.string(),
});

export const env = envSchema.parse(process.env);
