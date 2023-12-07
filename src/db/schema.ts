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
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const UsersTable = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  image: text("image"),
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
    slug: text("slug").notNull().primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    yield: text("yield").notNull(),
    createdBy: text("createdBy")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    tags: jsonb("tags").$type<string[]>().notNull(), // Using jsonb to store tags
    activeTime: text("activeTime").notNull(),
    cookTime: text("cookTime").notNull(),
    totalTime: text("totalTime").notNull(),
    ingredients: jsonb("ingredients").$type<string[]>().notNull(), // Using jsonb to store ingredients
    instructions: jsonb("instructions").$type<string[]>().notNull(), // Using jsonb to store ingredients
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => {
    return {
      // tagsIdx: index("tags_idx").on(table.tags),
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
    slug: text("slug")
      .notNull()
      .references(() => RecipesTable.slug),
    userId: text("userId")
      .notNull()
      .references(() => UsersTable.id),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.slug, table.userId] }),
    };
  }
);

export const UpvoteSchema = createSelectSchema(UpvotesTable);
export const NewUpvoteSchema = createInsertSchema(UpvotesTable);

export const mediaTypeEnum = pgEnum("mediaType", ["IMAGE", "VIDEO"]);

// Consolidated MediaUploads Table
export const MediaTable = pgTable("media", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => UsersTable.id),
  mediaType: mediaTypeEnum("media_type").notNull(),
  contentType: text("content_type").notNull(),
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
    recipeSlug: text("recipe_slug")
      .notNull()
      .references(() => RecipesTable.slug),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => MediaTable.id),
    sortOrder: bigint("sort_order", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.recipeSlug, table.mediaId] }),
    };
  }
);

export const RecipeMediaSchema = createSelectSchema(RecipeMediaTable);
export const NewRecipeMediaSchema = createInsertSchema(RecipeMediaTable);

export const RecipeHistoryTable = pgTable("recipe_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipeSlug: text("recipe_slug")
    .notNull()
    .references(() => RecipesTable.slug),
  previousVersion: jsonb("previous_version").notNull(), // Store the entire previous version of the recipe
  modifiedBy: text("modified_by")
    .notNull()
    .references(() => UsersTable.id), // Assuming changes are made by a user
  modifiedAt: timestamp("modified_at", { mode: "date" }).notNull().defaultNow(),
});

export const RecipeModificationTable = pgTable("recipe_modification", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipeSlug: text("recipe_slug")
    .notNull()
    .references(() => RecipesTable.slug),
  modifiedBy: text("modified_by")
    .notNull()
    .references(() => UsersTable.id),
  modificationType: text("modification_type").notNull(), // e.g., "ingredients", "scale"
  modificationDetails: jsonb("modification_details").notNull(), // details of the modification
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Define the ProfileTable
export const ProfileTable = pgTable("profile", {
  profileSlug: text("profile_slug").notNull().primaryKey(),
  activated: boolean("activated").notNull().default(false),
  mediaId: uuid("media_id").references(() => MediaTable.id),
  serialNum: bigserial("serial_num", { mode: "number" }),
  userId: text("user_id")
    .notNull()
    .references(() => UsersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Create schemas for selection and insertion
export const ProfileSchema = createSelectSchema(ProfileTable);
export const NewProfileSchema = createInsertSchema(ProfileTable);
