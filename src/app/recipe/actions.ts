import { RecipesTable, UpvotesTable, db } from "@/db";
import { getErrorMessage } from "@/lib/error";
import { eq } from "drizzle-orm";

export const upvoteById = async (userId: string, recipeId: string) => {
  "use server";

  try {
    const result = await db
      .insert(UpvotesTable)
      .values({
        recipeId,
        userId,
      })
      .onConflictDoNothing()
      .returning(); // Retrieve the inserted row

    if (result.length === 0) {
      return {
        success: false as const,
        error: "No upvote added due to possible duplicate or conflict.",
      };
    }

    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: getErrorMessage(error) }; // Return the error message
  }
};

export const upvoteBySlug = async (userId: string, slug: string) => {
  "use server";

  try {
    // Step 1: Fetch the recipe ID using the slug
    const recipe = await db
      .select({
        id: RecipesTable.id,
      })
      .from(RecipesTable)
      .where(eq(RecipesTable.slug, slug))
      .execute()
      .then((res) => res[0]);

    // Check if the recipe was found
    if (!recipe) {
      return {
        success: false as const,
        error: "Recipe not found.",
      };
    }

    // Step 2: Insert the upvote using the fetched recipe ID
    const result = await db
      .insert(UpvotesTable)
      .values({
        recipeId: recipe.id, // Use the fetched recipe ID
        userId,
      })
      .onConflictDoNothing()
      .returning(); // Retrieve the inserted row

    if (result.length === 0) {
      return {
        success: false as const,
        error: "No upvote added due to possible duplicate or conflict.",
      };
    }

    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: getErrorMessage(error) }; // Return the error message
  }
};
