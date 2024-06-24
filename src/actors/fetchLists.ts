import { ListRecipeTable, ListTable } from "@/db";
import { createClient } from "@vercel/postgres";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { fromPromise } from "xstate";

export const fetchLists = fromPromise(
  async ({ input }: { input: { userId: string } }) => {
    const client = createClient();
    await client.connect();
    const db = drizzle(client);
    try {
      const lists = await db
        .select()
        .from(ListTable)
        .where(eq(ListTable.createdBy, input.userId))
        .execute();

      const listIds = lists.map((item) => item.id);
      const listRecipes = listIds.length
        ? await db
            .select()
            .from(ListRecipeTable)
            .where(inArray(ListRecipeTable.listId, listIds))
            .execute()
        : [];

      return { lists, listRecipes };
    } finally {
      await client.end();
    }
  }
);
