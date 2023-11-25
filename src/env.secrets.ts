import { PublicEnvironmentSchema } from "./schema";

export const privateEnv = PublicEnvironmentSchema.parse({
  KITCHENCRAFT_URL: process.env.NEXT_PUBLIC_KITCHENCRAFT_URL,
});
