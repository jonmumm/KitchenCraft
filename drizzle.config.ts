import type { Config } from "drizzle-kit";

import "dotenv/config";

console.log("HIII", process.env.POSTGRES_URL)

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.POSTGRES_URL || "",
  },
} satisfies Config;
