import { ProfileTable, RecipeComments, RecipesTable, db } from "@/db";
import { withDatabaseSpan } from "@/lib/observability";
import { eq } from "drizzle-orm";
import { cache } from "react";

export const getCommentsForRecipeSlug = cache(async (recipeSlug: string) => {
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
});

// export const getCommentsCountForRecipe = async (slug: string) => {
//   const query = db
//     .select({ value: count() })
//     .from(CommentsTable)
//     .innerJoin(RecipesTable, eq(RecipesTable.slug, slug))
//     .where(eq(CommentsTable.recipeId, RecipesTable.id));

//   const result = await withDatabaseSpan(
//     query,
//     "getCommentsCountForRecipe"
//   ).execute();
//   return result[0]?.value;
// };

// export const getFirstCommentForRecipe = async (recipeSlug: string) => {
//   const query = db
//     .select({
//       id: CommentsTable.id,
//       userId: CommentsTable.userId,
//       comment: CommentsTable.comment,
//       createdAt: CommentsTable.createdAt,
//       updatedAt: CommentsTable.updatedAt,
//       // Additional fields can be included if needed
//     })
//     .from(CommentsTable)
//     .innerJoin(RecipesTable, eq(RecipesTable.slug, CommentsTable.recipeSlug))
//     .where(eq(RecipesTable.slug, recipeSlug))
//     .orderBy(CommentsTable.createdAt) // Modify this as per your sorting criteria
//     .limit(1); // Limiting to the first comment

//   return await withDatabaseSpan(query, "getFirstCommentForRecipe")
//     .execute()
//     .then((res) => res[0]); // Return the first result
// };
