import { PublicEnvironmentSchema } from "./schema";

export const env = PublicEnvironmentSchema.parse({
  KITCHENCRAFT_URL:
    process.env.NEXT_PUBLIC_KITCHENCRAFT_URL ||
    `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`,
  ADSENSE_PUBLISHER_ID: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID,
  POSTHOG_CLIENT_KEY: process.env.NEXT_PUBLIC_POSTHOG_CLIENT_KEY,
  STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY,
  LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL || "debug",
  VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
});
