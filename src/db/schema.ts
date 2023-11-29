import type { AdapterAccount } from "@auth/core/adapters";
import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const UsersTable = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }),
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

export const VerificationTokens = pgTable(
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

export const RecipesTable = pgTable("recipe", {
  id: text("id").notNull().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: text("createdBy")
    .notNull()
    .references(() => UsersTable.id, { onDelete: "cascade" }),
  tags: jsonb("tags"), // Using jsonb to store tags
  ingredients: jsonb("ingredients"), // Using jsonb to store ingredients
  createdAt: timestamp("createdAt", { mode: "date" }).notNull(),
});

export const RecipeSchema = createSelectSchema(RecipesTable);
export const NewRecipeSchema = createInsertSchema(RecipesTable);

export const UpvotesTable = pgTable("upvote", {
  id: text("id").notNull().primaryKey(),
  recipeId: text("recipeId")
    .notNull()
    .references(() => RecipesTable.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => UsersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull(),
});

export const UpvoteSchema = createSelectSchema(UpvotesTable);
export const NewUpvoteSchema = createInsertSchema(UpvotesTable);
