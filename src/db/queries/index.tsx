import { TimeParamSchema } from "@/app/(home)/schema";
import {
  MediaTable,
  ProfileTable,
  RecipeMediaTable,
  RecipesTable,
  SubscriptionMembersTable,
  SubscriptionsTable,
  UpvotesTable,
  UserFeatureUsageTable,
  db,
} from "@/db";
import { getErrorMessage } from "@/lib/error";
import { and, count, desc, eq, inArray, max, sql } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { z } from "zod";

// constants
const gravity = 1.8;
const oneHourInSeconds = 3600;

// common select expressions
const hoursSincePosted = sql<number>`EXTRACT(EPOCH FROM NOW() - ${RecipesTable.createdAt}) / ${oneHourInSeconds}`;
const points = sql<number>`(COUNT(DISTINCT ${UpvotesTable.userId}) + COUNT(DISTINCT ${RecipeMediaTable.mediaId}))::int`;
const mediaCount = sql<number>`COUNT(DISTINCT ${RecipeMediaTable.mediaId})::int`;
const scoreExpression = sql<number>`(${points} - 1) / POW((EXTRACT(EPOCH FROM NOW() - ${RecipesTable.createdAt}) / ${oneHourInSeconds} + 2), ${gravity})`;

export const getHotRecipes = async (userId?: string) => {
  // Subquery to get the maximum versionId for each recipe
  const maxVersionSubquery = db
    .select({
      recipeId: RecipesTable.id,
      maxVersionId: max(RecipesTable.versionId).as("maxVersionId"),
    })
    .from(RecipesTable)
    .groupBy(RecipesTable.id)
    .as("maxVersionSubquery"); // Naming the subquery

  // Main query
  return await db
    .select({
      id: RecipesTable.id,
      versionId: RecipesTable.versionId, // Include versionId in the selection
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
    .leftJoin(UpvotesTable, eq(RecipesTable.id, UpvotesTable.recipeId))
    .leftJoin(RecipeMediaTable, eq(RecipesTable.id, RecipeMediaTable.recipeId))
    .leftJoin(
      maxVersionSubquery,
      and(
        eq(RecipesTable.id, maxVersionSubquery.recipeId),
        eq(RecipesTable.versionId, maxVersionSubquery.maxVersionId)
      )
    )
    .groupBy(
      RecipesTable.id,
      RecipesTable.versionId, // Include versionId in groupBy
      RecipesTable.slug,
      RecipesTable.name,
      RecipesTable.description,
      RecipesTable.tags,
      RecipesTable.totalTime,
      RecipesTable.createdAt
    )
    .orderBy(desc(scoreExpression))
    .limit(30)
    .execute();
};

export const getRecipe = async (slug: string) => {
  return await db
    .select({
      id: RecipesTable.id,
      versionId: RecipesTable.versionId,
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
    .innerJoin(RecipesTable, eq(RecipesTable.id, RecipeMediaTable.recipeId))
    .where(eq(RecipesTable.slug, recipeSlug))
    .orderBy(RecipeMediaTable.sortOrder)
    .limit(10) // Limit the number of media items
    .execute();
};

export const getMediaCountForRecipe = async (slug: string) => {
  const result = await db
    .select({ value: count() }) // Using count() to count the number of rows
    .from(RecipeMediaTable)
    .innerJoin(RecipesTable, eq(RecipesTable.slug, slug))
    .where(eq(RecipeMediaTable.recipeId, slug)) // Filtering by recipeSlug
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
    .innerJoin(RecipesTable, eq(RecipesTable.id, RecipeMediaTable.recipeId))
    .where(eq(RecipesTable.slug, recipeSlug))
    .orderBy(RecipeMediaTable.sortOrder)
    .limit(1) // Limit to the first media item
    .execute()
    .then((res) => res[0]); // Return the first result
};

export const getRecentRecipesByUser = async (userId: string) => {
  return await db
    .select({
      id: RecipesTable.id,
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
    .leftJoin(UpvotesTable, eq(RecipesTable.id, UpvotesTable.recipeId))
    .leftJoin(RecipeMediaTable, eq(RecipesTable.id, RecipeMediaTable.recipeId)) // LEFT JOIN to include media count
    .where(eq(RecipesTable.createdBy, userId))
    .groupBy(
      RecipesTable.id,
      RecipesTable.slug,
      RecipesTable.name,
      RecipesTable.description,
      RecipesTable.totalTime,
      RecipesTable.createdBy,
      RecipesTable.createdAt
    )
    .orderBy(desc(RecipesTable.createdAt))
    .limit(30)
    .execute();
};

export const getRecentRecipesByProfile = async (profileSlug: string) => {
  const maxVersionSubquery = db
    .select({
      recipeId: RecipesTable.id,
      maxVersionId: max(RecipesTable.versionId).as("maxVersionId"),
    })
    .from(RecipesTable)
    .groupBy(RecipesTable.id)
    .as("maxVersionSubquery"); // Naming the subquery

  return await db
    .select({
      id: RecipesTable.id,
      verrsionId: RecipesTable.versionId,
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
    .leftJoin(UpvotesTable, eq(RecipesTable.id, UpvotesTable.recipeId))
    .leftJoin(RecipeMediaTable, eq(RecipesTable.id, RecipeMediaTable.recipeId))
    .leftJoin(
      maxVersionSubquery,
      and(
        eq(RecipesTable.id, maxVersionSubquery.recipeId),
        eq(RecipesTable.versionId, maxVersionSubquery.maxVersionId)
      )
    )
    .where(eq(ProfileTable.profileSlug, profileSlug))
    .groupBy(
      RecipesTable.id,
      RecipesTable.versionId,
      RecipesTable.slug,
      RecipesTable.name,
      RecipesTable.description,
      RecipesTable.createdBy,
      RecipesTable.createdAt,
      RecipesTable.totalTime
    )
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
      id: RecipesTable.id,
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
    .leftJoin(UpvotesTable, eq(RecipesTable.id, UpvotesTable.recipeId))
    .leftJoin(RecipeMediaTable, eq(RecipesTable.id, RecipeMediaTable.recipeId))
    .where(
      sql`LOWER(${tag}) = ANY (SELECT LOWER(jsonb_array_elements_text(${RecipesTable.tags})))`
    )
    .groupBy(
      RecipesTable.id,
      RecipesTable.slug,
      RecipesTable.name,
      RecipesTable.description,
      RecipesTable.tags,
      RecipesTable.totalTime,
      RecipesTable.createdAt,
      RecipesTable.createdBy
    )
    .orderBy(desc(RecipesTable.createdAt)) // Or any other order you prefer
    .limit(30)
    .execute();
};

export const getRecentRecipes = async () => {
  // Subquery to get the maximum versionId for each recipe
  const maxVersionSubquery = db
    .select({
      recipeId: RecipesTable.id,
      maxVersionId: max(RecipesTable.versionId).as("maxVersionId"),
    })
    .from(RecipesTable)
    .groupBy(RecipesTable.id)
    .as("maxVersionSubquery"); // Naming the subquery

  // Main query
  return await db
    .select({
      id: RecipesTable.id,
      versionId: RecipesTable.versionId, // Include versionId in the selection
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
    .leftJoin(UpvotesTable, eq(RecipesTable.id, UpvotesTable.recipeId))
    .leftJoin(RecipeMediaTable, eq(RecipesTable.id, RecipeMediaTable.recipeId))
    .leftJoin(
      maxVersionSubquery,
      and(
        eq(RecipesTable.id, maxVersionSubquery.recipeId),
        eq(RecipesTable.versionId, maxVersionSubquery.maxVersionId)
      )
    )
    .groupBy(
      RecipesTable.id,
      RecipesTable.versionId, // Include versionId in groupBy
      RecipesTable.slug,
      RecipesTable.name,
      RecipesTable.description,
      RecipesTable.tags,
      RecipesTable.totalTime,
      RecipesTable.createdBy,
      RecipesTable.createdAt
    )
    .orderBy(desc(RecipesTable.createdAt))
    .limit(30) // Adjust the limit as needed
    .execute();
};

export const getBestRecipes = async (
  timeFrame: z.infer<typeof TimeParamSchema>,
  userId?: string
) => {
  const timeCondition = getTimeCondition(timeFrame);

  // Subquery to get the maximum versionId for each recipe
  const maxVersionSubquery = db
    .select({
      recipeId: RecipesTable.id,
      maxVersionId: max(RecipesTable.versionId).as("maxVersionId"),
    })
    .from(RecipesTable)
    .groupBy(RecipesTable.id)
    .as("maxVersionSubquery"); // Naming the subquery

  // Main query
  return await db
    .select({
      id: RecipesTable.id,
      versionId: RecipesTable.versionId, // Include versionId in the selection
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
    .leftJoin(UpvotesTable, eq(RecipesTable.id, UpvotesTable.recipeId))
    .leftJoin(RecipeMediaTable, eq(RecipesTable.id, RecipeMediaTable.recipeId))
    .leftJoin(
      maxVersionSubquery,
      and(
        eq(RecipesTable.id, maxVersionSubquery.recipeId),
        eq(RecipesTable.versionId, maxVersionSubquery.maxVersionId)
      )
    )
    .where(timeCondition)
    .groupBy(
      RecipesTable.id,
      RecipesTable.versionId, // Include versionId in groupBy
      RecipesTable.slug,
      RecipesTable.name,
      RecipesTable.description,
      RecipesTable.tags,
      RecipesTable.totalTime,
      RecipesTable.createdBy,
      RecipesTable.createdAt
    )
    .orderBy(desc(sql<number>`COUNT(${UpvotesTable.userId})`)) // Adjust as needed for your 'best' criteria
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

interface MediaItem {
  id: string;
  url: string;
  width: number;
  height: number;
  mediaType: string;
  blobDataURL: string;
  recipeSlug: string; // Include the recipe slug to identify the media's recipe
}

export const getSortedMediaForMultipleRecipes = async (
  recipeSlugs: string[]
): Promise<{ [slug: string]: MediaItem[] }> => {
  const mediaItems = (await db
    .select({
      id: MediaTable.id,
      url: MediaTable.url,
      width: MediaTable.width,
      height: MediaTable.height,
      mediaType: MediaTable.mediaType,
      blobDataURL: MediaTable.blurDataURL,
      recipeSlug: RecipesTable.slug,
    })
    .from(RecipeMediaTable)
    .innerJoin(MediaTable, eq(MediaTable.id, RecipeMediaTable.mediaId))
    .innerJoin(RecipesTable, eq(RecipesTable.id, RecipeMediaTable.recipeId))
    .where(inArray(RecipesTable.slug, recipeSlugs))
    .orderBy(RecipeMediaTable.sortOrder)
    .execute()) as MediaItem[];

  // Group media items by their recipe slug
  let mediaBySlug: { [slug: string]: MediaItem[] } = {};
  mediaItems.forEach((media) => {
    if (!mediaBySlug[media.recipeSlug]) {
      mediaBySlug[media.recipeSlug] = [];
    }
    mediaBySlug[media.recipeSlug]?.push(media);
  });

  // Optional: Arrange the results in the order of the provided slugs
  let orderedResults: { [slug: string]: MediaItem[] } = {};
  recipeSlugs.forEach((slug) => {
    orderedResults[slug] = mediaBySlug[slug] || [];
  });

  return orderedResults;
};

export const getUpvoteStatusForMultipleRecipes = async (
  recipeSlugs: string[],
  userId: string
): Promise<{ [slug: string]: boolean }> => {
  const upvoteItems = (await db
    .select({
      slug: UpvotesTable.recipeId,
      userId: UpvotesTable.userId,
    })
    .from(UpvotesTable)
    .innerJoin(RecipesTable, eq(RecipesTable.id, UpvotesTable.recipeId))
    .where(
      and(
        inArray(RecipesTable.slug, recipeSlugs),
        eq(UpvotesTable.userId, userId)
      )
    )
    .execute()) as { slug: string; userId: string }[];

  // Initialize a dictionary to hold the upvote status for each recipe
  let upvoteStatusBySlug: { [slug: string]: boolean } = {};

  // Set default values for each recipe slug as false (no upvote)
  recipeSlugs.forEach((slug) => {
    upvoteStatusBySlug[slug] = false;
  });

  // Update the dictionary based on the upvote data
  upvoteItems.forEach((item) => {
    if (item.userId === userId) {
      upvoteStatusBySlug[item.slug] = true;
    }
  });

  return upvoteStatusBySlug;
};

export const getProfileByUserId = async (userId: string) => {
  return await db
    .select({
      profileSlug: ProfileTable.profileSlug,
      activated: ProfileTable.activated,
      mediaId: ProfileTable.mediaId,
      userId: ProfileTable.userId,
      createdAt: ProfileTable.createdAt,
    })
    .from(ProfileTable)
    .where(eq(ProfileTable.userId, userId)) // Filter by the given userId
    .execute()
    .then((res) => res[0]); // Return the first (and expectedly only) result
};

export const getUserPointsLast30Days = async (userId: string) => {
  const thirtyDaysInSeconds = 30 * 24 * 3600; // Seconds in 30 days
  return await db
    .select({
      userId: RecipesTable.createdBy,
      points: sql<number>`(COUNT(DISTINCT ${UpvotesTable.userId}) + COUNT(DISTINCT ${RecipeMediaTable.mediaId}))::int`,
    })
    .from(RecipesTable)
    .leftJoin(UpvotesTable, eq(RecipesTable.id, UpvotesTable.recipeId))
    .leftJoin(RecipeMediaTable, eq(RecipesTable.id, RecipeMediaTable.recipeId))
    .where(
      and(
        eq(RecipesTable.createdBy, userId),
        sql`EXTRACT(EPOCH FROM NOW() - ${RecipesTable.createdAt}) <= ${thirtyDaysInSeconds}`
      )
    )
    .groupBy(RecipesTable.createdBy)
    .execute()
    .then((res) => res[0]?.points || 0);
};

export const getUserLifetimePoints = async (userId: string) => {
  return await db
    .select({
      userId: RecipesTable.createdBy,
      points: sql<number>`(COUNT(DISTINCT ${UpvotesTable.userId}) + COUNT(DISTINCT ${RecipeMediaTable.mediaId}))::int`,
    })
    .from(RecipesTable)
    .leftJoin(UpvotesTable, eq(RecipesTable.id, UpvotesTable.recipeId))
    .leftJoin(RecipeMediaTable, eq(RecipesTable.id, RecipeMediaTable.recipeId))
    .where(eq(RecipesTable.createdBy, userId))
    .groupBy(RecipesTable.createdBy)
    .execute()
    .then((res) => res[0]?.points || 0);
};

export const getProfileLifetimePoints = async (profileSlug: string) => {
  return await db
    .select({
      profileSlug: ProfileTable.profileSlug,
      points: sql<number>`(COUNT(DISTINCT ${UpvotesTable.userId}) + COUNT(DISTINCT ${RecipeMediaTable.mediaId}))::int`,
    })
    .from(RecipesTable)
    .leftJoin(UpvotesTable, eq(RecipesTable.id, UpvotesTable.recipeId))
    .leftJoin(RecipeMediaTable, eq(RecipesTable.id, RecipeMediaTable.recipeId))
    .innerJoin(ProfileTable, eq(ProfileTable.userId, RecipesTable.createdBy))
    .where(eq(ProfileTable.profileSlug, profileSlug))
    .groupBy(ProfileTable.profileSlug)
    .execute()
    .then((res) => res[0]?.points || 0);
};

export const getProfilePointsLast30Days = async (profileSlug: string) => {
  const thirtyDaysInSeconds = 30 * 24 * 3600; // Seconds in 30 days
  return await db
    .select({
      profileSlug: ProfileTable.profileSlug,
      points: sql<number>`(COUNT(DISTINCT ${UpvotesTable.userId}) + COUNT(DISTINCT ${RecipeMediaTable.mediaId}))::int`,
    })
    .from(RecipesTable)
    .leftJoin(UpvotesTable, eq(RecipesTable.id, UpvotesTable.recipeId))
    .leftJoin(RecipeMediaTable, eq(RecipesTable.id, RecipeMediaTable.recipeId))
    .innerJoin(ProfileTable, eq(ProfileTable.userId, RecipesTable.createdBy))
    .where(
      and(
        eq(ProfileTable.profileSlug, profileSlug),
        sql`EXTRACT(EPOCH FROM NOW() - ${RecipesTable.createdAt}) <= ${thirtyDaysInSeconds}`
      )
    )
    .groupBy(ProfileTable.profileSlug)
    .execute()
    .then((res) => res[0]?.points || 0);
};

type DbOrTransaction = typeof db | PgTransaction<any, any, any>; // Adjust the types accordingly

export const createRecipeMedia = async (
  dbOrTransaction: DbOrTransaction,
  slug: string,
  newMediaId: string
) => {
  try {
    // Determine if using a transaction or db instance
    const queryRunner =
      dbOrTransaction instanceof PgTransaction ? dbOrTransaction : db;

    // Fetch the recipe ID using the slug
    const recipe = await queryRunner
      .select({
        id: RecipesTable.id,
      })
      .from(RecipesTable)
      .where(eq(RecipesTable.slug, slug))
      .execute()
      .then((res) => res[0]);

    // Check if the recipe was found
    if (!recipe) {
      throw new Error("Recipe not found.");
    }

    // Insert the new media record using the fetched recipe ID
    await queryRunner.insert(RecipeMediaTable).values({
      recipeId: recipe.id, // Use the fetched recipe ID
      mediaId: newMediaId,
      sortOrder: new Date().getTime(),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
};

export const createSubscription = async (
  dbOrTransaction: DbOrTransaction,
  userId: string,
  stripeSubscriptionId: string,
  plan: string
) => {
  try {
    const queryRunner =
      dbOrTransaction instanceof PgTransaction ? dbOrTransaction : db;

    await queryRunner.insert(SubscriptionsTable).values({
      userId,
      stripeSubscriptionId,
      plan,
      status: "active", // Assuming the default status is 'active'
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
};

export const getSubscriptionByUserId = async (
  dbOrTransaction: DbOrTransaction,
  userId: string
) => {
  try {
    const queryRunner =
      dbOrTransaction instanceof PgTransaction ? dbOrTransaction : db;

    const subscription = await queryRunner
      .select({
        subscriptionId: SubscriptionsTable.id,
        stripeSubscriptionId: SubscriptionsTable.stripeSubscriptionId,
        plan: SubscriptionsTable.plan,
        status: SubscriptionsTable.status,
        createdAt: SubscriptionsTable.createdAt,
      })
      .from(SubscriptionsTable)
      .where(eq(SubscriptionsTable.userId, userId))
      .execute()
      .then((res) => res[0]);

    if (!subscription) {
      throw new Error("Subscription not found for the given user ID.");
    }

    return { success: true, subscription };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
};

export const updateSubscriptionStatus = async (
  dbOrTransaction: DbOrTransaction,
  subscriptionId: number, // Assuming the subscription ID is a number
  newStatus: string
) => {
  try {
    const queryRunner =
      dbOrTransaction instanceof PgTransaction ? dbOrTransaction : db;

    const updateResult = await queryRunner
      .update(SubscriptionsTable)
      .set({ status: newStatus })
      .where(eq(SubscriptionsTable.id, subscriptionId))
      .execute();

    if (updateResult.count === 0) {
      throw new Error(
        "No subscription found or status already set to the new value."
      );
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
};

export const trackFeatureUsage = async (
  dbOrTransaction: DbOrTransaction,
  userId: string,
  featureId: number, // Assuming the feature ID is a number
  usageCount: number = 1 // Default usage count is 1
) => {
  try {
    const queryRunner =
      dbOrTransaction instanceof PgTransaction ? dbOrTransaction : db;

    await queryRunner.insert(UserFeatureUsageTable).values({
      userId,
      featureId,
      timestamp: new Date(), // Records the time of usage
      usageCount,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
};

export const getFeatureUsage = async (
  dbOrTransaction: DbOrTransaction,
  userId: string,
  featureId: number // Assuming the feature ID is a number
) => {
  try {
    const queryRunner =
      dbOrTransaction instanceof PgTransaction ? dbOrTransaction : db;

    const featureUsage = await queryRunner
      .select({
        usageCount: UserFeatureUsageTable.usageCount,
      })
      .from(UserFeatureUsageTable)
      .where(
        and(
          eq(UserFeatureUsageTable.userId, userId),
          eq(UserFeatureUsageTable.featureId, featureId)
        )
      )
      .execute();

    return { success: true, featureUsage };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
};

export const addMemberToSubscription = async (
  dbOrTransaction: DbOrTransaction,
  subscriptionId: number, // Assuming the subscription ID is a number
  userId: string
) => {
  try {
    const queryRunner =
      dbOrTransaction instanceof PgTransaction ? dbOrTransaction : db;

    await queryRunner.insert(SubscriptionMembersTable).values({
      subscriptionId,
      userId,
      addedAt: new Date(),
      status: "active",
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
};

export const updateMemberStatusInSubscription = async (
  dbOrTransaction: DbOrTransaction,
  memberId: number, // Assuming the member ID is a number
  newStatus: string
) => {
  try {
    const queryRunner =
      dbOrTransaction instanceof PgTransaction ? dbOrTransaction : db;

    const updateResult = await queryRunner
      .update(SubscriptionMembersTable)
      .set({ status: newStatus })
      .where(eq(SubscriptionMembersTable.id, memberId))
      .execute();

    if (updateResult.count === 0) {
      throw new Error(
        "No member found or status already set to the new value."
      );
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
};
