import { pgTable, pgEnum, bigserial, text, timestamp, jsonb, uuid, integer, foreignKey, unique, boolean, bigint, serial, primaryKey, real, index } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"

export const affiliate = pgEnum("affiliate", ['Amazon', 'Etsy', 'Instacart', 'Target'])
export const feature_id = pgEnum("feature_id", ['push:trends', 'push:products', 'push:top_recipes', 'push:tips_and_tricks', 'push:awards', 'email:trends', 'email:products', 'email:top_recipes', 'email:tips_and_tricks', 'craft:instant-recipe', 'craft:suggested-recipes', 'recipe:create', 'recipe:prompt', 'email:awards'])
export const mediaType = pgEnum("mediaType", ['IMAGE', 'VIDEO', 'GENERATED', 'UPLOAD'])
export const preference_key_enum = pgEnum("preference_key_enum", ['dietary_restrictions', 'cuisine_preferences', 'cooking_frequency', 'cooking_equipment', 'ingredient_preference', 'time_availability', 'meal_type_preferences', 'allergy_info', 'skill_level', 'dietaryRestrictions', 'cuisinePreferences', 'cookingFrequency', 'cookingEquipment', 'ingredientPreference', 'timeAvailability', 'skillLevel'])
export const sourceType = pgEnum("sourceType", ['GENERATED', 'UPLOAD'])
export const type = pgEnum("type", ['ingredient', 'book', 'equipment'])


export const user_feature_log = pgTable("user_feature_log", {
	id: bigserial("id", { mode: "bigint" }).primaryKey().notNull(),
	user_id: text("user_id"),
	feature_id: feature_id("feature_id").notNull(),
	timestamp: timestamp("timestamp", { mode: 'string' }).defaultNow(),
	metadata: jsonb("metadata"),
});

export const media = pgTable("media", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	created_by: text("created_by"),
	media_type: mediaType("media_type").notNull(),
	content_type: text("content_type").notNull(),
	width: integer("width").notNull(),
	height: integer("height").notNull(),
	filename: text("filename"),
	duration: integer("duration"),
	blurDataURL: text("blurDataURL").notNull(),
	url: text("url").notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	source_type: sourceType("source_type").default('UPLOAD').notNull(),
});

export const profile = pgTable("profile", {
	profile_slug: text("profile_slug").primaryKey().notNull(),
	activated: boolean("activated").default(false).notNull(),
	media_id: uuid("media_id").references(() => media.id),
	serial_num: bigserial("serial_num", { mode: "bigint" }).notNull(),
	user_id: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		profile_user_id_unique: unique("profile_user_id_unique").on(table.user_id),
	}
});

export const session = pgTable("session", {
	sessionToken: text("sessionToken").primaryKey().notNull(),
	userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" } ),
	expires: timestamp("expires", { mode: 'string' }).notNull(),
});

export const user = pgTable("user", {
	id: text("id").primaryKey().notNull(),
	name: text("name"),
	email: text("email"),
	emailVerified: timestamp("emailVerified", { mode: 'string' }),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	image: text("image"),
	stripe_customer_id: text("stripe_customer_id"),
},
(table) => {
	return {
		user_email_unique: unique("user_email_unique").on(table.email),
	}
});

export const subscription = pgTable("subscription", {
	id: bigserial("id", { mode: "bigint" }).primaryKey().notNull(),
	user_id: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
	stripe_subscription_id: text("stripe_subscription_id").notNull(),
	plan: text("plan").notNull(),
	status: text("status").notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const subscription_member = pgTable("subscription_member", {
	id: bigserial("id", { mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subscription_id: bigint("subscription_id", { mode: "number" }).notNull().references(() => subscription.id),
	user_id: text("user_id").notNull().references(() => user.id),
	added_at: timestamp("added_at", { mode: 'string' }).defaultNow().notNull(),
	status: text("status").default('active').notNull(),
},
(table) => {
	return {
		subscription_member_subscription_id_user_id_unique: unique("subscription_member_subscription_id_user_id_unique").on(table.subscription_id, table.user_id),
	}
});

export const feature = pgTable("feature", {
	id: serial("id").primaryKey().notNull(),
	feature_name: text("feature_name").notNull(),
	description: text("description"),
	quota_limit: integer("quota_limit"),
});

export const user_feature_usage = pgTable("user_feature_usage", {
	id: bigserial("id", { mode: "bigint" }).primaryKey().notNull(),
	user_id: text("user_id"),
	feature_id: feature_id("feature_id").notNull(),
	timestamp: timestamp("timestamp", { mode: 'string' }).defaultNow(),
	usage_count: integer("usage_count").default(1),
});

export const faq = pgTable("faq", {
	id: bigserial("id", { mode: "bigint" }).primaryKey().notNull(),
	recipe_slug: text("recipe_slug").notNull(),
	version_id: integer("version_id").notNull(),
	user_id: text("user_id").notNull().references(() => user.id),
	question: text("question").notNull(),
	answer: text("answer"),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const recipe_comments = pgTable("recipe_comments", {
	id: bigserial("id", { mode: "bigint" }).primaryKey().notNull(),
	recipe_id: uuid("recipe_id").notNull(),
	user_id: text("user_id").notNull(),
	mediaIds: jsonb("mediaIds"),
	comment: text("comment").notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	edit_history: jsonb("edit_history").notNull(),
});

export const affiliate_product = pgTable("affiliate_product", {
	name: text("name").notNull(),
	type: type("type").notNull(),
	affiliate: affiliate("affiliate").notNull(),
	affiliate_unique_id: text("affiliate_unique_id").notNull(),
	image_url: text("image_url").notNull(),
	image_width: integer("image_width").notNull(),
	image_height: integer("image_height").notNull(),
	blur_data_url: text("blur_data_url").notNull(),
	curated: boolean("curated").default(false).notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	metadata: jsonb("metadata"),
},
(table) => {
	return {
		affiliate_unique_id_idx: unique("affiliate_unique_id_idx").on(table.affiliate, table.affiliate_unique_id),
	}
});

export const push_subscriptions = pgTable("push_subscriptions", {
	id: serial("id").primaryKey().notNull(),
	belongsTo: text("belongsTo").notNull(),
	subscription: jsonb("subscription").notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const comment = pgTable("comment", {
	id: bigserial("id", { mode: "bigint" }).primaryKey().notNull(),
	recipe_slug: text("recipe_slug").notNull().references(() => recipe.slug),
	user_id: text("user_id").notNull().references(() => user.id),
	comment: text("comment").notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }),
	edit_history: jsonb("edit_history").notNull(),
});

export const user_preferences = pgTable("user_preferences", {
	preference_id: bigserial("preference_id", { mode: "bigint" }).primaryKey().notNull(),
	user_id: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
	preference_key: preference_key_enum("preference_key").notNull(),
	preference_value: jsonb("preference_value").notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		user_preferences_user_id_and_preference_key_idx: unique("user_preferences_user_id_and_preference_key_idx").on(table.user_id, table.preference_key),
	}
});

export const list = pgTable("list", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	slug: text("slug").notNull(),
	name: text("name").notNull(),
	created_by: text("created_by").notNull().references(() => user.id, { onDelete: "cascade" } ),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		createdby_by_slug_unique_idx: unique("createdby_by_slug_unique_idx").on(table.slug, table.created_by),
	}
});

export const generated_media = pgTable("generated_media", {
	recipe_slug: text("recipe_slug").notNull().references(() => recipe.slug),
	media_id: uuid("media_id").notNull().references(() => media.id),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		generated_media_recipe_slug_media_id_pk: primaryKey({ columns: [table.recipe_slug, table.media_id], name: "generated_media_recipe_slug_media_id_pk"}),
	}
});

export const verificationToken = pgTable("verificationToken", {
	identifier: text("identifier").notNull(),
	token: text("token").notNull(),
	expires: timestamp("expires", { mode: 'string' }).notNull(),
},
(table) => {
	return {
		verificationtoken_identifier_token_pk: primaryKey({ columns: [table.identifier, table.token], name: "verificationtoken_identifier_token_pk"}),
	}
});

export const upvote = pgTable("upvote", {
	recipe_id: uuid("recipe_id").notNull(),
	user_id: text("user_id").notNull().references(() => user.id),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		upvote_recipe_id_user_id_pk: primaryKey({ columns: [table.recipe_id, table.user_id], name: "upvote_recipe_id_user_id_pk"}),
	}
});

export const user_feature_state = pgTable("user_feature_state", {
	user_id: text("user_id").notNull(),
	feature_id: feature_id("feature_id").notNull(),
	enabled: boolean("enabled").default(true).notNull(),
	timestamp: timestamp("timestamp", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		user_feature_state_user_id_feature_id_pk: primaryKey({ columns: [table.user_id, table.feature_id], name: "user_feature_state_user_id_feature_id_pk"}),
	}
});

export const recipe_rating = pgTable("recipe_rating", {
	recipe_slug: text("recipe_slug").notNull().references(() => recipe.slug),
	user_id: text("user_id").notNull().references(() => user.id),
	value: real("value").notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		recipe_rating_user_id_recipe_slug_pk: primaryKey({ columns: [table.recipe_slug, table.user_id], name: "recipe_rating_user_id_recipe_slug_pk"}),
	}
});

export const recipe_media = pgTable("recipe_media", {
	recipe_id: uuid("recipe_id").notNull(),
	media_id: uuid("media_id").notNull().references(() => media.id),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sort_order: bigint("sort_order", { mode: "number" }).notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		recipe_media_recipe_id_media_id_pk: primaryKey({ columns: [table.recipe_id, table.media_id], name: "recipe_media_recipe_id_media_id_pk"}),
	}
});

export const list_recipe = pgTable("list_recipe", {
	user_id: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
	recipe_id: uuid("recipe_id").notNull(),
	list_id: uuid("list_id").notNull().references(() => list.id, { onDelete: "cascade" } ),
	added_at: timestamp("added_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		list_recipe_list_id_recipe_id_pk: primaryKey({ columns: [table.recipe_id, table.list_id], name: "list_recipe_list_id_recipe_id_pk"}),
	}
});

export const amazon_affiliate_product = pgTable("amazon_affiliate_product", {
	name: text("name").notNull(),
	image_url: text("image_url").notNull(),
	blur_data_url: text("blur_data_url"),
	image_width: integer("image_width").notNull(),
	image_height: integer("image_height").notNull(),
	asin: text("asin").notNull(),
	type: type("type").notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	recipe_slug: text("recipe_slug").notNull(),
},
(table) => {
	return {
		amazon_affiliate_product_recipe_slug_asin_pk: primaryKey({ columns: [table.asin, table.recipe_slug], name: "amazon_affiliate_product_recipe_slug_asin_pk"}),
	}
});

export const account = pgTable("account", {
	userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" } ),
	type: text("type").notNull(),
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
(table) => {
	return {
		account_provider_provideraccountid_pk: primaryKey({ columns: [table.provider, table.providerAccountId], name: "account_provider_provideraccountid_pk"}),
	}
});

export const recipe = pgTable("recipe", {
	id: uuid("id").defaultRandom().notNull(),
	version_id: integer("version_id").notNull(),
	slug: text("slug").notNull(),
	name: text("name").notNull(),
	description: text("description").notNull(),
	yield: text("yield").notNull(),
	createdBy: text("createdBy").notNull(),
	tags: jsonb("tags").notNull(),
	activeTime: text("activeTime").notNull(),
	cookTime: text("cookTime").notNull(),
	totalTime: text("totalTime").notNull(),
	ingredients: jsonb("ingredients").notNull(),
	instructions: jsonb("instructions").notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	prompt: text("prompt").notNull(),
	tokens: jsonb("tokens").default([]).notNull(),
},
(table) => {
	return {
		tags_gin_idx: index("tags_gin_idx").using("btree", table.tags),
		recipe_id_version_id_pk: primaryKey({ columns: [table.id, table.version_id], name: "recipe_id_version_id_pk"}),
		recipe_slug_unique: unique("recipe_slug_unique").on(table.slug),
	}
});