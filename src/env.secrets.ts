import { PublicEnvironmentSchema, SecretsEnvironmentSchema } from "./schema";

export const privateEnv = SecretsEnvironmentSchema.parse({
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
});
