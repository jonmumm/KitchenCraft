import type { CreateMessage } from "ai";
import { z } from "zod";
import {
  COOKING_TIMES,
  COOKWARES,
  CUISINES,
  DISH_TYPES,
  TECHNIQUES,
} from "./constants";

export const RecipeRequiredPropsSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  fromSuggestionsKey: z.string(),
});

const UserIdSchema = z.string();

export const SuggestionPredictionInputSchema = z.object({
  prompt: z.string().optional().default(""),
  ingredients: z.string().optional().default(""),
  tags: z.string().optional().default(""),
});

// z.object({
//   prompt: z.string().min(0),
//   ingredients: z.string().optional(),
// });

export const SuggestionPredictionOutputItemSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const SuggestionPredictionOutputSchema = z.object({
  suggestions: z.array(SuggestionPredictionOutputItemSchema),
});

export const SuggestionPredictionPartialOutputSchema =
  SuggestionPredictionOutputSchema.deepPartial();

export const TipsPredictionOutputSchema = z.object({
  tips: z.array(z.string()),
});
export const TipsPredictionPartialOutputSchema =
  TipsPredictionOutputSchema.deepPartial();

export const RemixIdeasPredictionOutputSchema = z.object({
  ideas: z.array(z.string()),
});
export const RemixIdeasPredictionPartialOutputSchema =
  RemixIdeasPredictionOutputSchema.deepPartial();

export const SuggestionSchema = SuggestionPredictionOutputItemSchema.merge(
  z.object({
    id: z.string(),
  })
);
export const SuggestionsSchema = z.array(SuggestionSchema);

export const RecipePredictionInputSchema = z.object({
  name: z.string(),
  description: z.string(),
  suggestionsInput: SuggestionPredictionInputSchema,
  // ingredients: z.string(),
  // suggestionsOutputYaml: z.string(),
});

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

export const RunStatusSchema = z
  .enum(["initializing", "starting", "started", "receiving", "done", "error"])
  .nullable();

// export const ChainSchema =

// const MessageSchema = z.custom<Message>();
const CreateMessageSchema = z.custom<CreateMessage>();

export const MessageIdSchema = z.string();
export const ChatIdSchema = z.string();

export const LLMMessageSetIdSchema = z.tuple([
  MessageIdSchema,
  MessageIdSchema,
  MessageIdSchema,
]);

export const MessageTypeSchema = z.enum([
  "query",
  "recipe",
  "remix",
  "modifications",
  "tips",
]);

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
  // senderId: UserIdSchema,
  role: z.literal("user"),
  type: MessageTypeSchema,
});

export const SystemMessageSchema = z.object({
  id: MessageIdSchema,
  content: MessageContentSchema,
  role: z.literal("system"),
  type: MessageTypeSchema,
});

export const AssistantMessageSchema = z.object({
  id: MessageIdSchema,
  content: MessageContentSchema.optional(),
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

export const CraftSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  conjureMessageSet: LLMMessageSetSchema,
});

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

const SelectRelatedIdeaEventSchema = z.object({
  type: z.literal("SELECT_RELATED_IDEA"),
  name: z.string(),
  description: z.string(),
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
  SelectRelatedIdeaEventSchema,
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

const RecipePredictionDataSchema = z.object({
  activeTime: z.string().regex(/^PT(\d+H)?(\d+M)?$/),
  cookTime: z.string().regex(/^PT(\d+H)?(\d+M)?$/),
  totalTime: z.string().regex(/^PT(\d+H)?(\d+M)?$/),
  yield: z.string(),
  tags: z.array(z.string()),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
});

export const RecipePredictionOutputSchema = z.object({
  recipe: RecipePredictionDataSchema,
});

export const RecipePredictionPartialOutputSchema =
  RecipePredictionOutputSchema.deepPartial();

// Schema for Recipe
// export const RecipeSchema = z
//   .object({
//     slug: SlugSchema,
//     name: z.string().min(1).max(140),
//     description: z.string().min(1).max(140),
//     createdAt: z.string(),
//     chatId: z.string(),
//     status: z.enum(["initialized", "crafting", "done"]).default("initialized"),
//     queryMessageSet: LLMMessageSetIdSchema,
//     modificationsMessageSet: LLMMessageSetIdSchema.optional(),
//     tipsMessageSet: LLMMessageSetIdSchema.optional(),
//     messageSet: LLMMessageSetIdSchema.optional(),
//   })
//   .merge(RecipePredictionDataSchema);
export const RecipeSchema = RecipeRequiredPropsSchema.merge(
  RecipePredictionOutputSchema.shape.recipe.partial()
).merge(
  z.object({
    runStatus: RunStatusSchema.optional(),
    createdAt: z.string().optional(),
  })
);

export const RecipeChatInputSchema = z.object({
  chatId: z.string(),
  recipe: RecipeSchema.optional(),
  recipeMessages: z.array(MessageSchema),
});

export const PromptSchema = z.string().nonempty().min(2).max(500);

export type RecipeRequiredProps = z.infer<typeof RecipeRequiredPropsSchema>;

export const RemixIdeasPredictionInputSchema = z.object({
  recipe: RecipeSchema.pick({ name: true, description: true }).merge(
    RecipePredictionOutputSchema.shape.recipe.pick({
      ingredients: true,
      tags: true,
      instructions: true,
    })
  ),
});

export const TipsPredictionInputSchema = z.object({
  recipe: RecipeSchema.pick({ name: true, description: true }).merge(
    RecipePredictionOutputSchema.shape.recipe.pick({
      ingredients: true,
      tags: true,
      instructions: true,
    })
  ),
});
