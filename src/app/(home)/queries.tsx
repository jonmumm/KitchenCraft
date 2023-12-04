import {
  MediaTable,
  RecipeMediaTable,
  RecipesTable,
  UpvotesTable,
  db,
} from "@/db";
import { count, desc, eq, sql } from "drizzle-orm";

export const getTopRecipes = async (userId?: string) => {
  const oneHourInSeconds = 3600;
  const gravity = 1.8;

  const scoreExpression = sql<number>`(COUNT(${UpvotesTable.userId}) - 1) / POW((EXTRACT(EPOCH FROM NOW() - ${RecipesTable.createdAt}) / ${oneHourInSeconds} + 2), ${gravity})`;
  // const userVotedExpression = userId
  //   ? sql<boolean>`CASE WHEN ${UpvotesTable.userId} = ${userId} THEN true ELSE false END`
  //   : sql<boolean>`false`; // Default to false if userId is not provided

  return await db
    .select({
      slug: RecipesTable.slug,
      name: RecipesTable.name,
      description: RecipesTable.description,
      tags: RecipesTable.tags,
      totalTime: RecipesTable.totalTime,
      points: sql<number>`COUNT(${UpvotesTable.userId})`,
      hoursSincePosted: sql<number>`EXTRACT(EPOCH FROM NOW() - ${RecipesTable.createdAt}) / ${oneHourInSeconds}`,
      score: scoreExpression,
      // userVoted: userVotedExpression,
    })
    .from(RecipesTable)
    .leftJoin(UpvotesTable, eq(RecipesTable.slug, UpvotesTable.slug))
    .groupBy(RecipesTable.slug)
    .orderBy(desc(scoreExpression))
    .limit(30)
    .execute();
};

export const getRecipe = async (slug: string) => {
  return await db
    .select({
      slug: RecipesTable.slug,
      name: RecipesTable.name,
      description: RecipesTable.description,
      createdBy: RecipesTable.createdBy,
      yield: RecipesTable.yield,
      tags: RecipesTable.tags,
      ingredients: RecipesTable.ingredients,
      instructions: RecipesTable.instructions,
      totalTime: RecipesTable.totalTime,
      activeTime: RecipesTable.activeTime,
      cookTime: RecipesTable.cookTime,
      createdAt: RecipesTable.createdAt,
    })
    .from(RecipesTable)
    .where(eq(RecipesTable.slug, slug))
    .execute()
    .then((res) => res[0]);
};

export const getSortedMediaForRecipe = async (recipeSlug: string) => {
  return await db
    .select({
      id: MediaTable.id,
      url: MediaTable.url,
      width: MediaTable.width,
      height: MediaTable.height,
      mediaType: MediaTable.mediaType,
    })
    .from(RecipeMediaTable)
    .innerJoin(MediaTable, eq(MediaTable.id, RecipeMediaTable.mediaId))
    .where(eq(RecipeMediaTable.recipeSlug, recipeSlug))
    .orderBy(RecipeMediaTable.sortOrder)
    .limit(10) // Limit the number of media items
    .execute();
};

export const getMediaCountForRecipe = async (slug: string) => {
  const result = await db
    .select({ value: count() }) // Using count() to count the number of rows
    .from(RecipeMediaTable)
    .where(eq(RecipeMediaTable.recipeSlug, slug)) // Filtering by recipeSlug
    .execute();

  return result[0]?.value;
};

export const getFirstMediaForRecipe = async (recipeSlug: string) => {
  return await db
    .select({
      id: MediaTable.id,
      url: MediaTable.url,
      width: MediaTable.width,
      height: MediaTable.height,
      contentType: MediaTable.contentType,
      mediaType: MediaTable.mediaType,
    })
    .from(RecipeMediaTable)
    .innerJoin(MediaTable, eq(MediaTable.id, RecipeMediaTable.mediaId))
    .where(eq(RecipeMediaTable.recipeSlug, recipeSlug))
    .orderBy(RecipeMediaTable.sortOrder)
    .limit(1) // Limit to the first media item
    .execute()
    .then((res) => res[0]); // Return the first result
};

export const getRecentRecipesByUser = async (userId: string) => {
  return await db
    .select({
      slug: RecipesTable.slug,
      name: RecipesTable.name,
      description: RecipesTable.description,
      totalTime: RecipesTable.totalTime,
      createdBy: RecipesTable.createdBy,
      createdAt: RecipesTable.createdAt,
    })
    .from(RecipesTable)
    .where(eq(RecipesTable.createdBy, userId))
    .orderBy(desc(RecipesTable.createdAt))
    .limit(30)
    .execute();
};
