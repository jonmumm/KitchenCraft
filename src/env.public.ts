import { PublicEnvironmentSchema } from "./schema";

export const env = PublicEnvironmentSchema.parse({
  KITCHENCRAFT_URL:
    process.env.NEXT_PUBLIC_KITCHENCRAFT_URL ||
    `https://${process.env.VERCEL_URL}`,
  ADSENSE_PUBLISHER_ID: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID,
});
