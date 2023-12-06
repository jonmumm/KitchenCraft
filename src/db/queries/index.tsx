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
const points = sql<number>`(COUNT(DISTINCT ${UpvotesTable.userId}) + COUNT(DISTINCT ${RecipeMediaTable.mediaId}))::int`;
const mediaCount = sql<number>`COUNT(DISTINCT ${RecipeMediaTable.mediaId})::int`;

export const getHotRecipes = async (userId?: string) => {
  const gravity = 1.8;

  const scoreExpression = sql<number>`(COUNT(DISTINCT ${UpvotesTable.userId}) - 1) / POW((EXTRACT(EPOCH FROM NOW() - ${RecipesTable.createdAt}) / ${oneHourInSeconds} + 2), ${gravity})`;

  return await db
    .select({
      slug: RecipesTable.slug,
      name: RecipesTable.name,
      description: RecipesTable.description,
      tags: RecipesTable.tags,
      totalTime: RecipesTable.totalTime,
      points,
      hoursSincePosted,
      score: scoreExpression,
      mediaCount,
    })
    .from(RecipesTable)
    .leftJoin(UpvotesTable, eq(RecipesTable.slug, UpvotesTable.slug))
    .leftJoin(
      RecipeMediaTable,
      eq(RecipesTable.slug, RecipeMediaTable.recipeSlug)
    ) // LEFT JOIN to include recipes with no media
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
      blobDataURL: MediaTable.blurDataURL,
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
      points,
      mediaCount: sql<number>`COUNT(DISTINCT ${RecipeMediaTable.mediaId})`, // Counts the number of unique media items per recipe
    })
    .from(RecipesTable)
    .leftJoin(UpvotesTable, eq(RecipesTable.slug, UpvotesTable.slug))
    .leftJoin(
      RecipeMediaTable,
      eq(RecipesTable.slug, RecipeMediaTable.recipeSlug)
    ) // LEFT JOIN to include media count
    .where(eq(RecipesTable.createdBy, userId))
    .groupBy(RecipesTable.slug) // Group by Recipe slug to allow COUNT to work correctly
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
      points,
      mediaCount: sql<number>`COUNT(DISTINCT ${RecipeMediaTable.mediaId})::int`,
    })
    .from(RecipesTable)
    .innerJoin(ProfileTable, eq(ProfileTable.userId, RecipesTable.createdBy))
    .leftJoin(UpvotesTable, eq(RecipesTable.slug, UpvotesTable.slug))
    .leftJoin(
      RecipeMediaTable,
      eq(RecipesTable.slug, RecipeMediaTable.recipeSlug)
    )
    .where(eq(ProfileTable.profileSlug, profileSlug))
    .groupBy(RecipesTable.slug)
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
      points,
      mediaCount,
    })
    .from(RecipesTable)
    .leftJoin(UpvotesTable, eq(RecipesTable.slug, UpvotesTable.slug))
    .leftJoin(
      RecipeMediaTable,
      eq(RecipesTable.slug, RecipeMediaTable.recipeSlug)
    )
    .where(
      sql`LOWER(${tag}) = ANY (SELECT LOWER(jsonb_array_elements_text(${RecipesTable.tags})))`
    )
    .groupBy(RecipesTable.slug)
    .orderBy(desc(RecipesTable.createdAt)) // Or any other order you prefer
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
      points,
      mediaCount,
    })
    .from(RecipesTable)
    .leftJoin(UpvotesTable, eq(RecipesTable.slug, UpvotesTable.slug))
    .leftJoin(
      RecipeMediaTable,
      eq(RecipesTable.slug, RecipeMediaTable.recipeSlug)
    )
    .groupBy(RecipesTable.slug)
    .orderBy(desc(RecipesTable.createdAt))
    .limit(30) // Adjust the limit as needed
    .execute();
};

export const getBestRecipes = async (
  timeFrame: z.infer<typeof TimeParamSchema>,
  userId?: string
) => {
  const timeCondition = getTimeCondition(timeFrame);

  return await db
    .select({
      slug: RecipesTable.slug,
      name: RecipesTable.name,
      description: RecipesTable.description,
      tags: RecipesTable.tags,
      totalTime: RecipesTable.totalTime,
      createdBy: RecipesTable.createdBy,
      createdAt: RecipesTable.createdAt,
      points,
      mediaCount,
    })
    .from(RecipesTable)
    .leftJoin(UpvotesTable, eq(RecipesTable.slug, UpvotesTable.slug))
    .leftJoin(
      RecipeMediaTable,
      eq(RecipesTable.slug, RecipeMediaTable.recipeSlug)
    )
    .where(timeCondition)
    .groupBy(RecipesTable.slug)
    .orderBy(desc(sql<number>`COUNT(${UpvotesTable.userId})`)) // You may also consider ordering by 'points' if that aligns better with your definition of 'best'
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
