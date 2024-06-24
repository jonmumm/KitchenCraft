import { RecipesTable } from "@/db";
import { createClient } from "@vercel/postgres";
import { and, eq, inArray, max } from "drizzle-orm";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { fromPromise } from "xstate";

export const getRecipes = fromPromise(
  async ({ input }: { input: { recipeIds: string[] } }) => {
    const client = createClient();
    try {
      await client.connect();
      const db = drizzle(client);
      const maxVersionSubquery = db
        .select({
          recipeId: RecipesTable.id,
          maxVersionId: max(RecipesTable.versionId).as("maxVersionId"),
        })
        .from(RecipesTable)
        .groupBy(RecipesTable.id)
        .as("maxVersionSubquery"); // Naming the subquery

      const recipes = await db
        .select()
        .from(RecipesTable)
        .innerJoin(
          maxVersionSubquery,
          and(
            eq(RecipesTable.id, maxVersionSubquery.recipeId),
            eq(RecipesTable.versionId, maxVersionSubquery.maxVersionId)
          )
        )
        .where(inArray(RecipesTable.id, input.recipeIds));

      return recipes;
    } finally {
      await client.end();
    }
  }
);
