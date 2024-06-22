import { ListRecipeTable, ListTable } from "@/db";
import { getErrorMessage } from "@/lib/error";
import { createClient } from "@vercel/postgres";
import { desc, eq, sql as sqlFN } from "drizzle-orm";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { fromPromise } from "xstate";

export const getAllListsForUserWithRecipeCount = fromPromise(
  async ({ input }: { input: { userId: string } }) => {
    const client = createClient();
    await client.connect();
    const db = drizzle(client);
    try {
      const result = await db
        .select({
          id: ListTable.id,
          name: ListTable.name,
          slug: ListTable.slug,
          icon: ListTable.icon,
          createdAt: ListTable.createdAt,
          count: sqlFN<number>`COUNT(${ListRecipeTable.recipeId})`,
        })
        .from(ListTable)
        .leftJoin(ListRecipeTable, eq(ListTable.id, ListRecipeTable.listId))
        .where(eq(ListTable.createdBy, input.userId))
        .groupBy(ListTable.id)
        .orderBy(desc(ListTable.createdAt))
        .execute();

      return { success: true, result };
    } catch (error) {
      console.error("Error retrieving lists with recipe count:", error);
      return { success: false, error: getErrorMessage(error) };
    } finally {
      await client.end();
    }
  }
);
