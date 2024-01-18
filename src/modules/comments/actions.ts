"use server";

import { ProfileTable, RecipeComments, RecipesTable, db } from "@/db";
import { getRecipe } from "@/db/queries";
import { withDatabaseSpan } from "@/lib/observability";
import { assert } from "@/lib/utils";
import { eq } from "drizzle-orm";

// THese represent the "binded" server actions of how clients would call it
export type Actions = {
  postComment: (
    comment: string,
    mediaIds: string[] | null
  ) => Promise<{ success: boolean }>;
};

export async function postComment(
  slug: string,
  userId: string,
  comment: string,
  mediaIds: string[] | null
) {
  const recipe = await getRecipe(slug);
  assert(recipe, "expected recipe for " + slug);
  console.log("inserting comment");

  await withDatabaseSpan(
    db.insert(RecipeComments).values({
      comment,
      recipeId: recipe.id,
      userId,
      mediaIds,
      editHistory: [],
    }),
    "createComment"
  );

  return { success: true };
}

export async function getComments(recipeSlug: string) {
  const query = db
    .select({
      id: RecipeComments.id,
      comment: RecipeComments.comment,
      mediaIds: RecipeComments.mediaIds,
      authorSlug: ProfileTable.profileSlug,
      createdAt: RecipeComments.createdAt,
      updatedAt: RecipeComments.updatedAt,
    })
    .from(RecipeComments)
    .innerJoin(RecipesTable, eq(RecipesTable.id, RecipeComments.recipeId))
    .leftJoin(ProfileTable, eq(ProfileTable.userId, RecipeComments.userId))
    .where(eq(RecipesTable.slug, recipeSlug))
    .orderBy(RecipeComments.createdAt)
    .groupBy(
      RecipeComments.id,
      RecipeComments.comment,
      RecipeComments.mediaIds,
      ProfileTable.profileSlug,
      RecipeComments.createdAt,
      RecipeComments.updatedAt
    )
    .limit(50); // Adjust the limit as needed

  return await withDatabaseSpan(query, "getCommentsForRecipe").execute();
}
