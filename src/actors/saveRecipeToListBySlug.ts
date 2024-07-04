import { defaultListsBySlug } from "@/constants/lists";
import { ListRecipeTable, ListTable } from "@/db";
import { getErrorMessage } from "@/lib/error";
import { withDatabaseSpan } from "@/lib/observability";
import { assert, formatDisplayName } from "@/lib/utils";
import { DbOrTransaction } from "@/types";
import { sql } from "@vercel/postgres";
import { and, eq, sql as sqlFN } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { fromPromise } from "xstate";

export const saveRecipeToListBySlug = fromPromise(
  async ({
    input,
  }: {
    input: {
      recipeId: string;
      userId: string;
      listSlug: string;
    };
  }) => {
    const db = drizzle(sql);
    const result = await ensureListSlugExists(db, input.userId, input.listSlug);
    if (result.error) {
      console.error(result.error);
    }
    assert(result.success, "expected to get listId");

    await createListRecipe(db, input.userId, input.recipeId, result.listId);
  }
);

const ensureListSlugExists = async (
  dbOrTransaction: DbOrTransaction,
  userId: string,
  slug: string
) => {
  const db = drizzle(sql);
  const queryRunner =
    dbOrTransaction instanceof PgTransaction ? dbOrTransaction : db;

  try {
    // First, attempt to find the user's "My Cookbook" list.
    let result = await withDatabaseSpan(
      queryRunner
        .select({
          id: ListTable.id,
        })
        .from(ListTable)
        .where(and(eq(ListTable.slug, slug), eq(ListTable.createdBy, userId))),
      "findMyRecipesList"
    ).execute();

    // If the list exists, return the list ID.
    let item = result[0];
    if (item) {
      return { success: true, listId: item.id } as const;
    }
    const icon = defaultListsBySlug[slug]?.icon || "#️⃣";
    // If the list does not exist, create it.
    result = await queryRunner
      .insert(ListTable)
      .values({
        slug: slug,
        name: formatDisplayName(slug),
        icon,
        createdBy: userId,
        createdAt: sqlFN`NOW()`, // Automatically set the creation time to now
      })
      .returning({ id: ListTable.id });

    item = result[0];

    if (!item) {
      console.error(result);
      return {
        success: false,
        error: "was not able to insert list",
      } as const;
    }

    return { success: true, listId: item.id } as const;
  } catch (error) {
    return { success: false, error: getErrorMessage(error) } as const;
  }
};

const createListRecipe = async (
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
        .insert(ListRecipeTable)
        .values({
          userId: userId,
          recipeId: recipeId,
          listId: listId,
          addedAt: sqlFN`NOW()`, // Automatically set the added time to now
        })
        // Handling potential unique constraint violation
        .onConflictDoNothing({
          target: [ListRecipeTable.listId, ListRecipeTable.recipeId],
        }),
      "createListRecipe"
    ).execute();

    if (result.count === 0) {
      throw new Error("This recipe is already in the list.");
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
};
