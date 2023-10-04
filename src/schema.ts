import type { CreateMessage } from "ai";
import { z } from "zod";
import {
  COOKING_TIMES,
  COOKWARES,
  CUISINES,
  DISH_TYPES,
  TECHNIQUES,
} from "./constants";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_-]+$/, {
    message:
      "Slug can only contain lowercase letters, numbers, hyphens, and underscores",
  })
  .min(1)
  .max(100);

// Schema for Recipe
export const RecipeSchema = z.object({
  name: z.string().min(1).max(100),
  cuisine: z.string().min(1).max(100),
  ingredients: z.string().min(1),
  instructions: z.string().min(1),
  cook_time: z.string().min(1).max(20),
  image_url: z.string().url(),
  chat_id: z.string(),
});

// Schema for Chat
export const ChatSchema = z.object({
  user_id: z.string(),
  recipe_slug: slugSchema,
  query: z.string().min(1).max(500),
  ingredients: z.string().optional(),
  cuisine: z.string().optional(),
  techniques: z.string().optional(),
  cookwares: z.string().optional(),
  cook_time: z.string().optional(),
});

// export const ChatMessageSchema = z.object({
//   sender: z.enum(["user", "bot"]),
//   message: z.string().min(1).max(1000),
//   timestamp: z.string(),
// });

export const MessageContentSchema = z.string();

export const RoleSchema = z.enum(["system", "user", "assistant", "function"]);

// const MessageSchema = z.custom<Message>();
const CreateMessageSchema = z.custom<CreateMessage>();

export const MessageIdSchema = z.string();
const ChatIdSchema = z.string();

export const MessageTypeSchema = z.enum(["query", "selection"]);

export const CreateMessageInputSchema = z.object({
  id: MessageIdSchema.optional(),
  content: MessageContentSchema,
  type: MessageTypeSchema,
  chatId: ChatIdSchema,
});

const AssistantStateSchema = z.enum(["running", "done", "error"]);

const UserMessageSchema = z.object({
  id: MessageIdSchema,
  content: MessageContentSchema,
  chatId: ChatIdSchema,
  role: z.literal("user"),
  type: MessageTypeSchema,
});

const SystemMessageSchema = z.object({
  id: MessageIdSchema,
  content: MessageContentSchema,
  chatId: ChatIdSchema,
  role: z.literal("system"),
  type: MessageTypeSchema,
});

export const AssistantMessageSchema = z.object({
  id: MessageIdSchema,
  content: MessageContentSchema,
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

export const CreateRecipeInputSchema = z.object({
  parentId: MessageIdSchema,
  slug: z.string(),
  name: z.string(),
  description: z.string(),
});

const SelectRecipeEventSchema = z.object({
  type: z.literal("SELECT_RECIPE"),
  name: z.string(),
  description: z.string(),
});

const SetInputEventSchema = z.object({
  type: z.literal("SET_INPUT"),
  value: z.string(),
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
  SelectRecipeEventSchema,
  SetInputEventSchema,
  SubmitEventSchema,
  FocusPromptEventSchema,
  BlurPromptEventSchema,
  InitEventSchema,
  BackEventSchema,
  ToggleConfiguratorEventSchema,
  CloseConfiguratorEventSchema,
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
