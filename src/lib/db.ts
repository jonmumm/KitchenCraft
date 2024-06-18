import { createClient } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { z } from "zod";

export const DatabaseErrorSchema = z.object({
  length: z.number(),
  severity: z.string(),
  code: z.enum(["23505", "UNKNOWN"]),
  detail: z.string(),
  hint: z.string().optional(),
  position: z.string().optional(),
  internalPosition: z.string().optional(),
  internalQuery: z.string().optional(),
  where: z.string().optional(),
  schema: z.string(),
  table: z.string(),
  column: z.string().optional(),
  dataType: z.string().optional(),
  constraint: z.string(),
  file: z.string(),
  line: z.string(),
  routine: z.string(),
});

export const connectToDatabase = async () => {
  const client = createClient();
  await client.connect();
  const db = drizzle(client);
  return { client, db };
};

export const handleDatabaseError = (error: any) => {
  const parsedError = DatabaseErrorSchema.safeParse(error);
  if (parsedError.success) {
    throw parsedError.data;
  } else {
    throw error;
  }
};
