import type { AdapterAccount } from "@auth/core/adapters";
import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgMaterializedView,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const featureIdEnum = pgEnum("feature_id", [
  "push:trends",
  "push:products",
  "push:top_recipes",
  "push:tips_and_tricks",
  "push:awards",
  "email:trends",
  "email:products",
  "email:top_recipes",
  "email:tips_and_tricks",
  "email:awards",
  "craft:instant-recipe",
  "craft:suggested-recipes",
  "recipe:create",
  "recipe:prompt",
]);

export const UsersTable = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  image: text("image"),
  stripeCustomerId: text("stripe_customer_id"),
});
export const UserSchema = createSelectSchema(UsersTable);
export const NewUserSchema = createInsertSchema(UsersTable);

export const AccountsTable = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey(account.provider, account.providerAccountId),
  })
);
export const AccountSchema = createSelectSchema(AccountsTable);
export const NewAccountSchema = createInsertSchema(AccountsTable);

export const SessionsTable = pgTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => UsersTable.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const SessionSchema = createSelectSchema(SessionsTable);
export const NewSessionSchema = createInsertSchema(SessionsTable);

export const VerificationTokensTable = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token),
  })
);

export const VerificationTokenSchema = createSelectSchema(SessionsTable);
export const NewVerificatoknTokenSchema = createInsertSchema(SessionsTable);

export const RecipesTable = pgTable(
  "recipe",
  {
    id: uuid("id").notNull().defaultRandom(),
    versionId: integer("version_id").notNull(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    yield: text("yield").notNull(),
    tags: jsonb("tags").$type<string[]>().notNull(), // Using jsonb to store tags
    activeTime: text("activeTime").notNull(),
    prompt: text("prompt").notNull(),
    tokens: jsonb("tokens").$type<string[]>().notNull(), // Using jsonb to store ingredients
    cookTime: text("cookTime").notNull(),
    totalTime: text("totalTime").notNull(),
    ingredients: jsonb("ingredients").$type<string[]>().notNull(), // Using jsonb to store ingredients
    instructions: jsonb("instructions").$type<string[]>().notNull(), // Using jsonb to store ingredients
    createdBy: text("createdBy").notNull(), // no fk because if might references users that doesnt exist yet
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.versionId] }),
      tagsIndex: index("tags_gin_idx")
        .on(table.tags)
        .using(sql`gin`),
    };
  }
);

export const RecipeSchema = createSelectSchema(RecipesTable);
export const NewRecipeSchema = createInsertSchema(RecipesTable);

export const UpvotesTable = pgTable(
  "upvote",
  {
    recipeId: uuid("recipe_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => UsersTable.id),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.recipeId, table.userId],
      }),
    };
  }
);
export const UpvoteSchema = createSelectSchema(UpvotesTable);
export const NewUpvoteSchema = createInsertSchema(UpvotesTable);

export const mediaTypeEnum = pgEnum("mediaType", ["IMAGE", "VIDEO"]);
export const sourceTypeEnum = pgEnum("sourceType", ["GENERATED", "UPLOAD"]);

// Consolidated MediaUploads Table
export const MediaTable = pgTable("media", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdBy: text("created_by"),
  mediaType: mediaTypeEnum("media_type").notNull(),
  contentType: text("content_type").notNull(),
  sourceType: sourceTypeEnum("source_type").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  filename: text("filename"),
  duration: integer("duration"),
  blurDataURL: text("blurDataURL").notNull(), // You may want to make this nullable
  url: text("url").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const MediaSchema = createSelectSchema(MediaTable);
export const NewMediaSchema = createInsertSchema(MediaTable);

// New RecipeMedia Table
export const RecipeMediaTable = pgTable(
  "recipe_media",
  {
    recipeId: uuid("recipe_id"),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => MediaTable.id),
    sortOrder: bigint("sort_order", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.recipeId, table.mediaId] }),
    };
  }
);

export const RecipeMediaSchema = createSelectSchema(RecipeMediaTable);
export const NewRecipeMediaSchema = createInsertSchema(RecipeMediaTable);

// Define the ProfileTable
export const ProfileTable = pgTable("profile", {
  profileSlug: text("profile_slug").notNull().primaryKey(),
  activated: boolean("activated").notNull().default(false),
  mediaId: uuid("media_id").references(() => MediaTable.id),
  serialNum: bigserial("serial_num", { mode: "number" }),
  userId: text("user_id")
    .notNull()
    .references(() => UsersTable.id, { onDelete: "cascade" })
    .unique(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Create schemas for selection and insertion
export const ProfileSchema = createSelectSchema(ProfileTable);
export const NewProfileSchema = createInsertSchema(ProfileTable);

// ... [existing imports and tables]

// Subscriptions Table
export const SubscriptionsTable = pgTable("subscription", {
  id: bigserial("id", { mode: "number" }).notNull().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => UsersTable.id, { onDelete: "cascade" }),
  stripeSubscriptionId: text("stripe_subscription_id").notNull(), // Store Stripe Subscription ID
  plan: text("plan").notNull(), // e.g., 'monthly', 'quarterly', 'annual'
  status: text("status").notNull(), // e.g., 'active', 'cancelled'
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ... [SubscriptionsTable Schemas]
export const SubscriptionMembersTable = pgTable(
  "subscription_member",
  {
    id: bigserial("id", { mode: "number" }).notNull().primaryKey(),
    subscriptionId: bigint("subscription_id", { mode: "number" })
      .notNull()
      .references(() => SubscriptionsTable.id),
    userId: text("user_id")
      .notNull()
      .references(() => UsersTable.id),
    addedAt: timestamp("added_at", { mode: "date" }).notNull().defaultNow(),
    status: text("status").notNull().default("active"), // e.g., 'active', 'removed'
  },
  (table) => {
    return { unique: unique().on(table.subscriptionId, table.userId) };
  }
);

export const SubscriptionMemberSchema = createSelectSchema(
  SubscriptionMembersTable
);
export const NewSubscriptionMemberSchema = createInsertSchema(
  SubscriptionMembersTable
);

export const SubscriptionSchema = createSelectSchema(SubscriptionsTable);
export const NewSubscriptionSchema = createInsertSchema(SubscriptionsTable);

// Features Table
export const FeaturesTable = pgTable("feature", {
  id: serial("id").notNull().primaryKey(),
  featureName: text("feature_name").notNull(),
  description: text("description"),
  quotaLimit: integer("quota_limit"),
});

export const FeatureSchema = createSelectSchema(FeaturesTable);
export const NewFeatureSchema = createInsertSchema(FeaturesTable);

export const UserFeatureState = pgTable(
  "user_feature_state",
  {
    userId: text("user_id"),
    featureId: featureIdEnum("feature_id").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    timestamp: timestamp("timestamp").defaultNow(),
  },
  (table) => ({
    compoundKey: primaryKey(table.userId, table.featureId),
  })
);

export const UserFeatureLog = pgTable("user_feature_log", {
  id: bigserial("id", { mode: "number" }).notNull().primaryKey(),
  userId: text("user_id"),
  featureId: featureIdEnum("feature_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"),
});

// User Feature Usage Table
export const UserFeatureUsageTable = pgTable("user_feature_usage", {
  id: bigserial("id", { mode: "number" }).notNull().primaryKey(),
  userId: text("user_id"),
  featureId: featureIdEnum("feature_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  usageCount: integer("usage_count").default(1),
});

export const UserFeatureUsageSchema = createSelectSchema(UserFeatureUsageTable);
export const NewUserFeatureUsageSchema = createInsertSchema(
  UserFeatureUsageTable
);

// FAQ Table
export const FAQTable = pgTable("faq", {
  id: bigserial("id", { mode: "number" }).notNull().primaryKey(),
  recipeSlug: text("recipe_slug").notNull(),
  versionId: integer("version_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => UsersTable.id),
  question: text("question").notNull(),
  answer: text("answer"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const FAQSchema = createSelectSchema(FAQTable);
export const NewFAQSchema = createInsertSchema(FAQTable);

export const productTypeEnum = pgEnum("type", [
  "ingredient",
  "book",
  "equipment",
]);

// Amazon Affiliate Product Table
export const AmazonAffiliateProductTable = pgTable(
  "amazon_affiliate_product",
  {
    name: text("name").notNull(),
    imageUrl: text("image_url").notNull(),
    blurDataUrl: text("blur_data_url"),
    imageWidth: integer("image_width").notNull(),
    imageHeight: integer("image_height").notNull(),
    asin: text("asin").notNull(),
    type: productTypeEnum("type").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    recipeSlug: text("recipe_slug").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.recipeSlug, table.asin] }),
  })
);

export const AmazonAffiliateProductSchema = createSelectSchema(
  AmazonAffiliateProductTable
);
export const NewAmazonAffiliateProductSchema = createInsertSchema(
  AmazonAffiliateProductTable
);

export const GeneratedMediaTable = pgTable(
  "generated_media",
  {
    recipeSlug: text("recipe_slug")
      .notNull()
      .references(() => RecipesTable.slug),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => MediaTable.id),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.recipeSlug, table.mediaId] }),
    };
  }
);

export const PopularTagsView = pgMaterializedView("popular_tags").as((qb) =>
  qb
    .select({
      tag: sql`jsonb_array_elements_text(${RecipesTable.tags})`.as("tag"),
      tagCount: sql<number>`count(*)`.mapWith(Number).as("tag_count"),
    })
    .from(RecipesTable)
    .groupBy(sql`jsonb_array_elements_text(${RecipesTable.tags})`)
    .orderBy(sql`count(*)`)
    .limit(30)
);

export const PushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").notNull().primaryKey(),
  belongsTo: text("belongsTo").notNull(), // no fk because if might references users that doesnt exist yet
  subscription: jsonb("subscription").$type<PushSubscriptionJSON>().notNull(), // Using jsonb to store ingredients
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const RecipeRatingsTable = pgTable(
  "recipe_rating",
  {
    recipeSlug: text("recipe_slug")
      .notNull()
      .references(() => RecipesTable.slug), // Foreign key to the Recipes table
    userId: text("user_id")
      .notNull()
      .references(() => UsersTable.id), // Foreign key to the Users table
    value: real("value").notNull(), // Rating value based on the provided Zod schema
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(), // Timestamp when the rating was created
  },
  (table) => ({
    compoundKey: primaryKey(table.userId, table.recipeSlug),
  })
);

export const RecipeRatingSchema = createSelectSchema(RecipeRatingsTable);
export const NewRecipeRatingSchema = createInsertSchema(RecipeRatingsTable);

interface EditHistoryEntry {
  previousComment: string; // The previous version of the comment
  editedAt: string; // ISO 8601 format timestamp of when the edit was made
  editedBy: string; // Optional user ID of the person who made the edit
}

export const RecipeComments = pgTable("recipe_comments", {
  id: bigserial("id", { mode: "number" }).notNull().primaryKey(), // Primary key
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => RecipesTable.id), // Foreign key to the Recipes table
  userId: text("user_id").notNull(),
  mediaIds: jsonb("mediaIds").$type<string[]>(),
  comment: text("comment").notNull(), // Text of the comment
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(), // Timestamp when the comment was created
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(), // Timestamp for when the comment was last updated
  editHistory: jsonb("edit_history").$type<EditHistoryEntry[]>().notNull(), // JSONB field to store the edit history
});

// Create schemas for selection and insertion
export const RecipeCommentSchema = createSelectSchema(RecipeComments);
export const NewRecipeCommentSchema = createInsertSchema(RecipeComments);

export const affiliateEnum = pgEnum("affiliate", [
  "Amazon",
  "Etsy",
  "Instacart",
  "Target",
]);

// Amazon Affiliate Product Table
export const AffiliateProductTable = pgTable(
  "affiliate_product",
  {
    name: text("name").notNull(),
    type: productTypeEnum("type").notNull(),
    affiliate: affiliateEnum("affiliate").notNull(),
    affiliateUniqueId: text("affiliate_unique_id").notNull(),
    imageUrl: text("image_url").notNull(),
    imageWidth: integer("image_width").notNull(),
    imageHeight: integer("image_height").notNull(),
    blurDataUrl: text("blur_data_url").notNull(),
    curated: boolean("curated").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    unq: unique("affiliate_unique_id_idx").on(
      table.affiliate,
      table.affiliateUniqueId
    ),
  })
);

export const AffiliateProductSchema = createSelectSchema(AffiliateProductTable);
export const NewAffiliateProductSchema = createInsertSchema(
  AmazonAffiliateProductTable
);

export const UserRecipeTable = pgTable(
  "user_recipe", // Table name
  {
    userId: text("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }), // Link to UsersTable
    recipeId: uuid("recipe_id")
      .notNull(),
    addedAt: timestamp("added_at", { mode: "date" }).notNull().defaultNow(), // Timestamp of when the recipe was added
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.userId, table.recipeId], // Composite primary key
      }),
    };
  }
);

// Schema for selecting data from UserRecipeTable
export const UserRecipeSchema = createSelectSchema(UserRecipeTable);

// Schema for inserting new records into UserRecipeTable
export const NewUserRecipeSchema = createInsertSchema(UserRecipeTable);
