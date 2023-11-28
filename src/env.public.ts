import { PublicEnvironmentSchema } from "./schema";

export const env = PublicEnvironmentSchema.parse({
  KITCHENCRAFT_URL: process.env.NEXT_PUBLIC_KITCHENCRAFT_URL,
  ADSENSE_PUBLISHER_ID: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
