import { ListRecipeTable } from "@/db";
import { getErrorMessage } from "@/lib/error";
import { withDatabaseSpan } from "@/lib/observability";
import { DbOrTransaction } from "@/types";
import { sql } from "@vercel/postgres";
import { and, eq } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { fromPromise } from "xstate";

export const removeRecipeFromList = fromPromise(
  async ({
    input,
  }: {
    input: {
      listId: string;
      recipeId: string;
      userId: string;
    };
  }) => {
    const db = drizzle(sql);
    const result = await deleteListRecipe(
      db,
      input.userId,
      input.recipeId,
      input.listId
    );
    if (!result.success) {
      console.error(result.error);
      throw new Error(result.error);
    }
  }
);

const deleteListRecipe = async (
  dbOrTransaction: DbOrTransaction,
  userId: string,
  recipeId: string,
  listId: string
) => {
  const db = drizzle(sql);
  const queryRunner =
    dbOrTransaction instanceof PgTransaction ? dbOrTransaction : db;
  try {
    const result = await withDatabaseSpan(
      queryRunner
        .delete(ListRecipeTable)
        .where(
          and(
            eq(ListRecipeTable.userId, userId),
            eq(ListRecipeTable.recipeId, recipeId),
            eq(ListRecipeTable.listId, listId)
          )
        ),
      "deleteListRecipe"
    ).execute();

    if (result.rowCount === 0) {
      return {
        success: false,
        error:
          "Recipe not found in the list or you don't have permission to remove it.",
      };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
};
