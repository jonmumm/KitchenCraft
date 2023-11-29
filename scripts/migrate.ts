import "dotenv/config";
import { migrate } from "drizzle-orm/vercel-postgres/migrator";
import { db } from "../src/db";

(async () => {
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
})();
