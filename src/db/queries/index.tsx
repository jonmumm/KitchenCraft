import { TimeParamSchema } from "@/app/(home)/schema";
import {
  MediaTable,
  ProfileTable,
  RecipeMediaTable,
  RecipesTable,
  UpvotesTable,
  db,
} from "@/db";
import { count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

const oneHourInSeconds = 3600;
const hoursSincePosted = sql<number>`EXTRACT(EPOCH FROM NOW() - ${RecipesTable.createdAt}) / ${oneHourInSeconds}`;

export const getHotRecipes = async (userId?: string) => {
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
      hoursSincePosted,
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

export const getRecentRecipesByProfile = async (profileSlug: string) => {
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
    .innerJoin(ProfileTable, eq(ProfileTable.userId, RecipesTable.createdBy)) // Join with the Profile table
    .where(eq(ProfileTable.profileSlug, profileSlug)) // Filter by the profile slug
    .orderBy(desc(RecipesTable.createdAt)) // Order by most recent
    .limit(30) // Limit the number of results
    .execute();
};

export const getProfileBySlug = async (profileSlug: string) => {
  return await db
    .select({
      profileSlug: ProfileTable.profileSlug,
      activated: ProfileTable.activated,
      mediaId: ProfileTable.mediaId,
      userId: ProfileTable.userId,
      createdAt: ProfileTable.createdAt,
    })
    .from(ProfileTable)
    .where(eq(ProfileTable.profileSlug, profileSlug)) // Filter by the given profile slug
    .execute()
    .then((res) => res[0]); // Return the first (and expectedly only) result
};

export const getRecipesByTag = async (tag: string) => {
  return await db
    .select({
      slug: RecipesTable.slug,
      name: RecipesTable.name,
      description: RecipesTable.description,
      tags: RecipesTable.tags,
      totalTime: RecipesTable.totalTime,
      createdBy: RecipesTable.createdBy,
      createdAt: RecipesTable.createdAt,
    })
    .from(RecipesTable)
    .where(
      sql`LOWER(${tag}) = ANY (SELECT LOWER(jsonb_array_elements_text(${RecipesTable.tags})))`
    )
    .limit(30)
    .execute();
};

export const getRecentRecipes = async () => {
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
    .orderBy(desc(RecipesTable.createdAt))
    .limit(30) // You can adjust the limit as needed
    .execute();
};

export const getBestRecipes = async (
  timeFrame: z.infer<typeof TimeParamSchema>,
  userId?: string
) => {
  const timeCondition = getTimeCondition(timeFrame); // Function to get the time condition based on the timeFrame parameter

  return await db
    .select({
      slug: RecipesTable.slug,
      name: RecipesTable.name,
      description: RecipesTable.description,
      tags: RecipesTable.tags,
      totalTime: RecipesTable.totalTime,
      createdBy: RecipesTable.createdBy,
      createdAt: RecipesTable.createdAt,
    })
    .from(RecipesTable)
    .leftJoin(UpvotesTable, eq(RecipesTable.slug, UpvotesTable.slug))
    .where(timeCondition) // Apply time condition
    .groupBy(RecipesTable.slug)
    .orderBy(desc(sql<number>`COUNT(${UpvotesTable.userId})`)) // Order by count of upvotes
    .limit(30)
    .execute();
};

const getTimeCondition = (timeFrame: string) => {
  const oneHourInSeconds = 3600; // Seconds in an hour
  switch (timeFrame) {
    case "today":
      return sql`EXTRACT(EPOCH FROM NOW() - ${RecipesTable.createdAt}) / ${oneHourInSeconds} < 24`;
    case "week":
      return sql`EXTRACT(EPOCH FROM NOW() - ${RecipesTable.createdAt}) / ${oneHourInSeconds} < 168`; // 168 hours in a week
    case "month":
      return sql`EXTRACT(EPOCH FROM NOW() - ${RecipesTable.createdAt}) / ${oneHourInSeconds} < 720`; // Approx 720 hours in a month
    case "year":
      return sql`EXTRACT(EPOCH FROM NOW() - ${RecipesTable.createdAt}) / ${oneHourInSeconds} < 8760`; // Approx 8760 hours in a year
    case "all":
      return sql`TRUE`; // No time condition, select all
    default:
      throw new Error("Invalid time frame");
  }
};
