import type { z } from "zod";
import { trpc } from "./app/_trpc/client";
import ingredients from "./data/ingredients.json";
import {
  AppEventSchema,
  CookingTimeSchema,
  CookwareSchema,
  CreateMessageInputSchema,
  CreateRecipeInputSchema,
  CuisineSchema,
  DishTypeSchema,
  MessageSchema,
  AssistantMessageSchema,
  RecipeAttributeSchema,
  RecipeAttributesSchema,
  RecipeSchema,
  TechniqueSchema,
  RoleSchema,
  MessageContentSchema,
  RecipeChatInputSchema,
  UserMessageSchema,
  LLMMessageSetSchema,
  SystemMessageSchema,
  LLMMessageSetIdSchema,
  RecipePredictionOutputSchema,
  RecipePredictionPartialOutputSchema,
  SlugSchema,
  SuggestionPredictionInputSchema,
  SuggestionPredictionOutputSchema,
  RecipePredictionInputSchema,
  SuggestionSchema,
  SuggestionPredictionPartialOutputSchema,
} from "./schema";

export type AppEvent = z.infer<typeof AppEventSchema>;

export type Ingredient = (typeof ingredients)[0];

export type Recipe = z.infer<typeof RecipeSchema>;
export type DishType = z.infer<typeof DishTypeSchema>;
export type CookingTime = z.infer<typeof CookingTimeSchema>;
export type Cookware = z.infer<typeof CookwareSchema>;
export type Technique = z.infer<typeof TechniqueSchema>;
export type Cuisine = z.infer<typeof CuisineSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type AssistantMessage = z.infer<typeof AssistantMessageSchema>;

export type RecipeAttributes = z.infer<typeof RecipeAttributesSchema>;
export type RecipeAttribute = z.infer<typeof RecipeAttributeSchema>;

export type AppClient = ReturnType<typeof trpc.useContext>["client"];

export type CreateMessageInput = z.infer<typeof CreateMessageInputSchema>;
export type CreateRecipeInput = z.infer<typeof CreateRecipeInputSchema>;

export type MessageRole = z.infer<typeof RoleSchema>;
export type MessageContent = z.infer<typeof MessageContentSchema>;

export type RecipeChatInput = z.infer<typeof RecipeChatInputSchema>;
export type UserMessage = z.infer<typeof UserMessageSchema>;

export type LLMMessageSet = z.infer<typeof LLMMessageSetSchema>;
export type SystemMessage = z.infer<typeof SystemMessageSchema>;

export type LLMMessageSetId = z.infer<typeof LLMMessageSetIdSchema>;

export type RecipePromptResult = z.infer<typeof RecipePredictionOutputSchema>;
export type RecipeViewerData = z.infer<typeof RecipePredictionPartialOutputSchema>;

export type RecipeSlug = z.infer<typeof SlugSchema>;
export type SuggestionPredictionInput = z.infer<
  typeof SuggestionPredictionInputSchema
>;
export type SuggestionPredictionOutput = z.infer<
  typeof SuggestionPredictionOutputSchema
>;
export type SuggestionPredictionPartialOutput = z.infer<
  typeof SuggestionPredictionPartialOutputSchema
>;
export type RecipePredictionInput = z.infer<typeof RecipePredictionInputSchema>;
export type RecipePredictionOutput = z.infer<typeof RecipePredictionOutputSchema>;
export type RecipePredictionPartialOutput = z.infer<typeof RecipePredictionPartialOutputSchema>;

export type Suggestion = z.infer<typeof SuggestionSchema>;
