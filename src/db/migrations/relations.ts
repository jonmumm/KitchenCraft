import { relations } from "drizzle-orm/relations";
import { media, profile, user, session, subscription, subscription_member, faq, recipe, comment, user_preferences, list, generated_media, upvote, recipe_rating, recipe_media, list_recipe, account } from "./schema";

export const profileRelations = relations(profile, ({one}) => ({
	media: one(media, {
		fields: [profile.media_id],
		references: [media.id]
	}),
	user: one(user, {
		fields: [profile.user_id],
		references: [user.id]
	}),
}));

export const mediaRelations = relations(media, ({many}) => ({
	profiles: many(profile),
	generated_medias: many(generated_media),
	recipe_medias: many(recipe_media),
}));

export const userRelations = relations(user, ({many}) => ({
	profiles: many(profile),
	sessions: many(session),
	subscriptions: many(subscription),
	subscription_members: many(subscription_member),
	faqs: many(faq),
	comments: many(comment),
	user_preferences: many(user_preferences),
	lists: many(list),
	upvotes: many(upvote),
	recipe_ratings: many(recipe_rating),
	list_recipes: many(list_recipe),
	accounts: many(account),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const subscriptionRelations = relations(subscription, ({one, many}) => ({
	user: one(user, {
		fields: [subscription.user_id],
		references: [user.id]
	}),
	subscription_members: many(subscription_member),
}));

export const subscription_memberRelations = relations(subscription_member, ({one}) => ({
	subscription: one(subscription, {
		fields: [subscription_member.subscription_id],
		references: [subscription.id]
	}),
	user: one(user, {
		fields: [subscription_member.user_id],
		references: [user.id]
	}),
}));

export const faqRelations = relations(faq, ({one}) => ({
	user: one(user, {
		fields: [faq.user_id],
		references: [user.id]
	}),
}));

export const commentRelations = relations(comment, ({one}) => ({
	recipe: one(recipe, {
		fields: [comment.recipe_slug],
		references: [recipe.slug]
	}),
	user: one(user, {
		fields: [comment.user_id],
		references: [user.id]
	}),
}));

export const recipeRelations = relations(recipe, ({many}) => ({
	comments: many(comment),
	generated_medias: many(generated_media),
	recipe_ratings: many(recipe_rating),
}));

export const user_preferencesRelations = relations(user_preferences, ({one}) => ({
	user: one(user, {
		fields: [user_preferences.user_id],
		references: [user.id]
	}),
}));

export const listRelations = relations(list, ({one, many}) => ({
	user: one(user, {
		fields: [list.created_by],
		references: [user.id]
	}),
	list_recipes: many(list_recipe),
}));

export const generated_mediaRelations = relations(generated_media, ({one}) => ({
	media: one(media, {
		fields: [generated_media.media_id],
		references: [media.id]
	}),
	recipe: one(recipe, {
		fields: [generated_media.recipe_slug],
		references: [recipe.slug]
	}),
}));

export const upvoteRelations = relations(upvote, ({one}) => ({
	user: one(user, {
		fields: [upvote.user_id],
		references: [user.id]
	}),
}));

export const recipe_ratingRelations = relations(recipe_rating, ({one}) => ({
	recipe: one(recipe, {
		fields: [recipe_rating.recipe_slug],
		references: [recipe.slug]
	}),
	user: one(user, {
		fields: [recipe_rating.user_id],
		references: [user.id]
	}),
}));

export const recipe_mediaRelations = relations(recipe_media, ({one}) => ({
	media: one(media, {
		fields: [recipe_media.media_id],
		references: [media.id]
	}),
}));

export const list_recipeRelations = relations(list_recipe, ({one}) => ({
	user: one(user, {
		fields: [list_recipe.user_id],
		references: [user.id]
	}),
	list: one(list, {
		fields: [list_recipe.list_id],
		references: [list.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));