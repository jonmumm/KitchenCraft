import { RecipeRatingsTable, db } from "@/db";
import { getCurrentUserId } from "@/lib/auth/session";
import { withDatabaseSpan } from "@/lib/observability";
import { DbOrTransaction } from "@/types";
import { and, eq, sql } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { cache } from "react";
import { RatingValue } from "./types";

export const getCurrentUserRatingBySlug = cache(async (slug: string) => {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) {
    return undefined;
  }

  const query = db
    .select({
      userId: RecipeRatingsTable.userId,
      recipeSlug: RecipeRatingsTable.recipeSlug,
      value: RecipeRatingsTable.value, // Assuming 'value' is the column you want to retrieve
      createdAt: RecipeRatingsTable.createdAt,
    })
    .from(RecipeRatingsTable)
    .where(
      and(
        eq(RecipeRatingsTable.userId, currentUserId),
        eq(RecipeRatingsTable.recipeSlug, slug)
      )
    );

  return await withDatabaseSpan(query, "getRatingByUserIdAndSlug")
    .execute()
    .then((res) => res[0]);
});

export const upsertRecipeRating = async (
  dbOrTransaction: DbOrTransaction,
  userId: string,
  recipeSlug: string,
  value: RatingValue
) => {
  const queryRunner =
    dbOrTransaction instanceof PgTransaction ? dbOrTransaction : db;

  const result = await withDatabaseSpan(
    queryRunner
      .insert(RecipeRatingsTable)
      .values({
        userId: userId,
        recipeSlug: recipeSlug,
        value,
        // createdAt is automatically set to now by default
      })
      .onConflictDoUpdate({
        target: [RecipeRatingsTable.userId, RecipeRatingsTable.recipeSlug], // Composite key conflict target
        set: {
          value,
          createdAt: sql`NOW()`, // Update the timestamp to the current time
        },
      }),
    "upsertRecipeRating"
  ).execute();

  return result;
};
