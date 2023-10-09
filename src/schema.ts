import type { CreateMessage } from "ai";
import { z } from "zod";
import {
  COOKING_TIMES,
  COOKWARES,
  CUISINES,
  DISH_TYPES,
  TECHNIQUES,
} from "./constants";

export const SlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_-]+$/, {
    message:
      "Slug can only contain lowercase letters, numbers, hyphens, and underscores",
  })
  .min(1)
  .max(100);

export const MessageContentSchema = z.string();

export const RoleSchema = z.enum(["system", "user", "assistant", "function"]);

// const MessageSchema = z.custom<Message>();
const CreateMessageSchema = z.custom<CreateMessage>();

export const MessageIdSchema = z.string();
export const ChatIdSchema = z.string();

export const LLMMessageSetIdSchema = z.tuple([
  MessageIdSchema,
  MessageIdSchema,
  MessageIdSchema,
]);

export const MessageTypeSchema = z.enum(["query", "recipe"]);

export const CreateMessageInputSchema = z.object({
  id: MessageIdSchema.optional(),
  content: MessageContentSchema,
  type: MessageTypeSchema,
  chatId: ChatIdSchema,
});

const AssistantStateSchema = z.enum(["running", "done", "error"]);

export const UserMessageSchema = z.object({
  id: MessageIdSchema,
  content: MessageContentSchema,
  chatId: ChatIdSchema,
  role: z.literal("user"),
  type: MessageTypeSchema,
});

export const SystemMessageSchema = z.object({
  id: MessageIdSchema,
  content: MessageContentSchema,
  chatId: ChatIdSchema,
  role: z.literal("system"),
  type: MessageTypeSchema,
});

export const AssistantMessageSchema = z.object({
  id: MessageIdSchema,
  content: MessageContentSchema.optional(),
  chatId: ChatIdSchema,
  role: z.literal("assistant"),
  type: MessageTypeSchema,
  state: AssistantStateSchema,
});

export const MessageSchema = z.discriminatedUnion("role", [
  UserMessageSchema,
  SystemMessageSchema,
  AssistantMessageSchema,
]);

export const LLMMessageSetSchema = z.tuple([
  SystemMessageSchema,
  UserMessageSchema,
  AssistantMessageSchema,
]);

export const CreateRecipeInputSchema = z.object({
  chatId: ChatIdSchema,
  name: z.string(),
  description: z.string(),
});

const ModifyRecipeEventSchema = z.object({
  type: z.literal("MODIFY"),
  recipeSlug: SlugSchema,
});

const SelectRecipeEventSchema = z.object({
  type: z.literal("SELECT_RECIPE"),
  name: z.string(),
  description: z.string(),
});

const SetUsernameEventSchema = z.object({
  type: z.literal("SET_USERNAME"),
  value: SlugSchema,
});

const SetInputEventSchema = z.object({
  type: z.literal("SET_INPUT"),
  value: z.string(),
});

const StartOverEventSchema = z.object({
  type: z.literal("START_OVER"),
});

const BlurPromptEventSchema = z.object({
  type: z.literal("BLUR_PROMPT"),
});

const FocusPromptEventSchema = z.object({
  type: z.literal("FOCUS_PROMPT"),
});

const InitEventSchema = z.object({
  type: z.literal("INIT"),
});

const SubmitEventSchema = z.object({
  type: z.literal("SUBMIT"),
});

const BackEventSchema = z.object({
  type: z.literal("BACK"),
});

const ToggleConfiguratorEventSchema = z.object({
  type: z.literal("TOGGLE_CONFIGURATOR"),
});

const CloseConfiguratorEventSchema = z.object({
  type: z.literal("CLOSE_CONFIGURATOR"),
});

export const AppEventSchema = z.discriminatedUnion("type", [
  ModifyRecipeEventSchema,
  SelectRecipeEventSchema,
  SetInputEventSchema,
  SubmitEventSchema,
  FocusPromptEventSchema,
  BlurPromptEventSchema,
  InitEventSchema,
  BackEventSchema,
  ToggleConfiguratorEventSchema,
  CloseConfiguratorEventSchema,
  SetUsernameEventSchema,
  StartOverEventSchema,
]);

// TypeScript Type Literals
export const DishTypeSchema = z.enum(DISH_TYPES);
export const CookingTimeSchema = z.enum(COOKING_TIMES);
export const CookwareSchema = z.enum(COOKWARES);
export const TechniqueSchema = z.enum(TECHNIQUES);
export const CuisineSchema = z.enum(CUISINES);

const RecipeDetailsSchema = z.object({
  name: z.string(),
  ingredients: z.array(
    z.object({
      ingredient: z.string(),
      quantity: z.string(),
    })
  ),
  instructions: z.array(z.string()),
  preparationTime: z.string(),
  cookingTime: z.string(),
  serves: z.string(),
});

const NutritionFactsSchema = z.object({
  calories: z.number(),
  carbohydrates: z.number(),
  proteins: z.number(),
  fats: z.number(),
  saturatedFats: z.number().optional(),
  sugars: z.number().optional(),
  dietaryFiber: z.number().optional(),
});

export const FullRecipeSchema = z.object({
  details: RecipeDetailsSchema,
  nutritionFacts: NutritionFactsSchema,
});

export const RecipeAttributesSchema = z.object({
  prompt: z.string().optional(),
  ingredients: z.record(z.boolean()),
  techniques: z.record(z.boolean()),
  cuisines: z.record(z.boolean()),
  cookware: z.record(z.boolean()),
  dishType: DishTypeSchema.optional(),
  cookingTime: CookingTimeSchema.optional(),
});

export const RecipeAttributeSchema = RecipeAttributesSchema.keyof();

const HowToStep = z.object({
  "@type": z.literal("HowToStep"),
  text: z.string(),
});

export const RecipePromptResultSchema = z.object({
  prepTime: z.string().regex(/^PT(\d+H)?(\d+M)?$/),
  cookTime: z.string().regex(/^PT(\d+H)?(\d+M)?$/),
  totalTime: z.string().regex(/^PT(\d+H)?(\d+M)?$/),
  keywords: z.string(),
  recipeYield: z.string(),
  recipeCategory: z.string(),
  recipeCuisine: z.string(),
  recipeIngredient: z.array(z.string()),
  recipeInstructions: z.array(HowToStep),
});

export const RecipeViewerDataSchema = RecipePromptResultSchema.deepPartial();

// Schema for Recipe
export const RecipeSchema = z
  .object({
    slug: SlugSchema,
    name: z.string().min(1).max(140),
    description: z.string().min(1).max(140),
    chatId: z.string(),
    queryMessageSet: LLMMessageSetIdSchema,
    messageSet: LLMMessageSetIdSchema.optional(),
  })
  .merge(RecipeViewerDataSchema);

export const RecipeChatInputSchema = z.object({
  chatId: z.string(),
  recipe: RecipeSchema.optional(),
  recipeMessages: z.array(MessageSchema),
});
