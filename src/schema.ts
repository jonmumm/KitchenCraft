import type { CreateMessage } from "ai";
import { z } from "zod";
import {
  COOKING_TIMES,
  COOKWARES,
  CUISINES,
  DISH_TYPES,
  TECHNIQUES,
} from "./constants";
import { AmazonAffiliateProductSchema, RecipeSchema } from "./db";
import { RefObject } from "react";

export const PlanSchema = z
  .enum(["quarterly", "monthly", "annual"])
  .default("quarterly");

// Regex for URL-friendly string (alphanumeric, hyphens, underscores)
const isUrlFriendly = (str: string) => /^[a-zA-Z0-9_-]*$/.test(str);

export const ProfileSlugSchema = z.custom<`@${string}`>((val) => {
  return typeof val === "string" && val[0] === "@"
    ? isUrlFriendly(val.slice(1))
    : false;
});

// // Example usage
// try {
//     ProfileSchema.parse("@inspectorT");  // This should pass
//     TagSchema.parse("#fried");           // This should pass
// } catch (e) {
//     console.error(e);
// }

export const SecretsEnvironmentSchema = z.object({
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  NEXTAUTH_SECRET: z.string(),
  RESEND_API_KEY: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  GOOGLE_CUSTOM_SEARCH_API_KEY: z.string(),
  GOOGLE_CUSTOM_SEARCH_ENGINE_ID: z.string(),
});

export const PublicEnvironmentSchema = z.object({
  KITCHENCRAFT_URL: z.string().url(),
  ADSENSE_PUBLISHER_ID: z.string(),
  POSTHOG_CLIENT_KEY: z.string(),
  STRIPE_PUBLIC_KEY: z.string(),
  LOG_LEVEL: z.enum(["info", "debug", "verbose"]),
});

const FreeTextLiteral = z.literal("free_text");
const SubstituteLiteral = z.literal("substitute");
const DietaryLiteral = z.literal("dietary");
const EquipmentLiteral = z.literal("equipment");
const ScaleLiteral = z.literal("scale");

export const ModificationSchema = z.union([
  FreeTextLiteral,
  SubstituteLiteral,
  DietaryLiteral,
  EquipmentLiteral,
  ScaleLiteral,
]);

export const RunStatusSchema = z
  .enum(["initializing", "starting", "started", "receiving", "done", "error"])
  .nullable();

export const RecipeRequiredPropsSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  createdAt: z.string(),
  runStatus: RunStatusSchema,
  mediaCount: z.number().default(0),
  previewMediaIds: z.array(z.string()).optional().default([]),
});

const UserIdSchema = z.string();

export const SuggestionPredictionInputSchema = z
  .object({
    ingredients: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    prompt: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasIngredients = data.ingredients && data.ingredients.length > 0;
      const hasTags = data.tags && data.tags.length > 0;
      const hasPrompt = data.prompt?.trim() !== "";
      return hasIngredients || hasTags || hasPrompt;
    },
    {
      message:
        "At least one of 'ingredients', 'tags', or 'prompt' must have a non-empty value",
    }
  );

// export const SuggestionPredictionInputSchema = z.object({
//   prompt: z.string().optional().default(""),
//   ingredients: z.string().optional().default(""),
//   tags: z.string().optional().default(""),
// });

// z.object({
//   prompt: z.string().min(0),
//   ingredients: z.string().optional(),
// });

export const SuggestionItemSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const InstantRecipeMetadataPredictionOutputSchema = SuggestionItemSchema;

export const SuggestionPredictionOutputSchema = z.object({
  suggestions: z.array(SuggestionItemSchema),
});
export const QuestionsPredictionOutputSchema = z.object({
  questions: z.array(z.string()),
});

export const IdeasPredictionOutputSchema = z.object({
  ideas: z.array(z.string()),
});
export const IdeasPredictionPartialOutputSchema =
  IdeasPredictionOutputSchema.deepPartial();

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

export const SuggestionSchema = SuggestionItemSchema.merge(
  z.object({
    id: z.string(),
  })
);
export const SuggestionsSchema = z.array(SuggestionSchema);

export const RecipePathSchema = z
  .string()
  .refine(
    (path) => {
      const parts = path.split("/");

      // Check that the path has the correct structure
      return parts.length === 3 && parts[0] === "" && parts[1] === "recipe";
    },
    {
      message: "Invalid full pathname. Must be in the format of /recipe/[slug]",
    }
  )
  .transform((path) => {
    // We know the path has the correct format so we can split and return the slug part directly
    const slug = path.split("/")[2];
    // Use the SlugSchema to parse and validate the slug
    return SlugSchema.parse(slug);
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

const SelectResultEventSchema = z.object({
  type: z.literal("SELECT_RESULT"),
  index: z.number(),
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

const SubmitPromptEventSchema = z.object({
  type: z.literal("SUBMIT_PROMPT"),
  prompt: z.string(),
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

const NewRecipeEventSchema = z.object({
  type: z.literal("NEW_RECIPE"),
});

const ModifyEventSchema = z.object({
  type: z.literal("MODIFY"),
  modification: ModificationSchema,
  slug: SlugSchema,
});

const AddIngredientEventSchema = z.object({
  type: z.literal("ADD_INGREDIENT"),
  ingredient: z.string(),
});

const SousChefFeedbackEventSchema = z.object({
  type: z.literal("FEEDBACK"),
  rating: z.number(),
  question: z.string(),
  answer: z.string(),
});

const AddTagEventSchema = z.object({
  type: z.literal("ADD_TAG"),
  tag: z.string(),
});

const RemoveTagEventSchema = z.object({
  type: z.literal("REMOVE_TAG"),
  tag: z.string(),
});

const RemoveIngredientEventSchema = z.object({
  type: z.literal("REMOVE_INGREDIENT"),
  ingredient: z.string(),
});

const CloseEventSchema = z.object({
  type: z.literal("CLOSE"),
});

const SaveEventSchema = z.object({
  type: z.literal("SAVE"),
  opts: z
    .object({
      asNew: z.boolean(),
    })
    .optional(),
});

const CreateNewRecipeLiteral = z.literal("CREATE_NEW_RECIPE");
const SuggestRecipesLiteral = z.literal("SUGGEST_RECIPES");
const InstantRecipeLiteral = z.literal("INSTANT_RECIPE");
const ModifyRecipeIngredientsLiteral = z.literal("MODIFY_RECIPE_INGREDIENTS");
const ModifyRecipeDietaryLiteral = z.literal("MODIFY_RECIPE_DIETARY");
const ModifyReicpeScaleLiteral = z.literal("MODIFY_RECIPE_SCALE");
const ModifyRecipeEquipmentLiteral = z.literal("MODIFY_RECIPE_EQUIPMENT");
const ModifyRecipeFreeTextLiteral = z.literal("MODIFY_RECIPE_FREE_TEXT");

const CreateNewRecipeEventSchema = z.object({
  type: CreateNewRecipeLiteral,
});
const SuggestRecipesEventSchema = z.object({
  type: SuggestRecipesLiteral,
});
const InstantRecipeEventSchema = z.object({
  type: InstantRecipeLiteral,
});
export const ModifyRecipeFreeTextEventSchema = z.object({
  type: ModifyRecipeFreeTextLiteral,
  prompt: z.string(),
});
const ModifyRecipeEquipmentEventSchema = z.object({
  type: ModifyRecipeEquipmentLiteral,
});
const ModifyRecipeDietaryEventSchema = z.object({
  type: ModifyRecipeDietaryLiteral,
});
const ModifyRecipeScaleEventSchema = z.object({
  type: ModifyReicpeScaleLiteral,
});
const ModifyRecipeIngredientsEventSchema = z.object({
  type: ModifyRecipeIngredientsLiteral,
});
const ToggleEventSchema = z.object({
  type: z.literal("TOGGLE"),
});
const ClearEventSchema = z.object({
  type: z.literal("CLEAR"),
});

const PageLoadedEventSchema = z.object({
  type: z.literal("PAGE_LOADED"),
  pathname: z.string(),
});

const SearchParamsEventSchema = z.object({
  type: z.literal("UPDATE_SEARCH_PARAMS"),
  searchParams: z.record(z.string(), z.string()),
});

const HashChangeEventSchema = z.object({
  type: z.literal("HASH_CHANGE"),
  hash: z.string(),
});

const SignInEventSchema = z.object({
  type: z.literal("SIGN_IN"),
});

const SignOutEventSchema = z.object({
  type: z.literal("SIGN_OUT"),
});

export const UpvoteEventSchema = z.object({
  type: z.literal("UPVOTE"),
  slug: z.string(),
});

export const RemixEventSchema = z.object({
  type: z.literal("REMIX"),
  slug: SlugSchema,
});

export const ShareEventSchema = z.object({
  type: z.literal("SHARE"),
  slug: SlugSchema,
});

const ShareCompleteEventSchema = z.object({
  type: z.literal("SHARE_COMPLETE"),
  slug: SlugSchema,
});

const ShareCancelEventSchema = z.object({
  type: z.literal("SHARE_CANCEL"),
  slug: SlugSchema,
});

const DownloadAppEventShema = z.object({
  type: z.literal("DOWNLOAD_APP"),
});

const HydratInputEventSchema = z.object({
  type: z.literal("HYDRATE_INPUT"),
  ref: z.custom<HTMLTextAreaElement>(),
});

const KeyDownEventSchema = z.object({
  type: z.literal("KEY_DOWN"),
  keyboardEvent: z.custom<React.KeyboardEvent<HTMLTextAreaElement>>(),
});

export const AppEventSchema = z.discriminatedUnion("type", [
  DownloadAppEventShema,
  KeyDownEventSchema,
  RemixEventSchema,
  PageLoadedEventSchema,
  SearchParamsEventSchema,
  HashChangeEventSchema,
  ShareEventSchema,
  ShareCompleteEventSchema,
  ShareCancelEventSchema,
  UpvoteEventSchema,
  SignInEventSchema,
  SignOutEventSchema,
  ClearEventSchema,
  ToggleEventSchema,
  CreateNewRecipeEventSchema,
  SuggestRecipesEventSchema,
  InstantRecipeEventSchema,
  ModifyRecipeIngredientsEventSchema,
  ModifyRecipeEquipmentEventSchema,
  ModifyRecipeFreeTextEventSchema,
  ModifyRecipeScaleEventSchema,
  ModifyRecipeDietaryEventSchema,
  SaveEventSchema,
  CloseEventSchema,
  NewRecipeEventSchema,
  ModifyEventSchema,
  SelectRecipeEventSchema,
  SelectResultEventSchema,
  SelectRelatedIdeaEventSchema,
  SetInputEventSchema,
  SubmitEventSchema,
  SubmitPromptEventSchema,
  FocusPromptEventSchema,
  BlurPromptEventSchema,
  InitEventSchema,
  BackEventSchema,
  ToggleConfiguratorEventSchema,
  CloseConfiguratorEventSchema,
  SetUsernameEventSchema,
  StartOverEventSchema,
  RemoveIngredientEventSchema,
  RemoveTagEventSchema,
  AddTagEventSchema,
  AddIngredientEventSchema,
  SousChefFeedbackEventSchema,
  HydratInputEventSchema,
]);

// TypeScript Type Literals
export const DishTypeSchema = z.enum(DISH_TYPES);
export const CookingTimeSchema = z.enum(COOKING_TIMES);
export const CookwareSchema = z.enum(COOKWARES);
export const TechniqueSchema = z.enum(TECHNIQUES);
export const CuisineSchema = z.enum(CUISINES);

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

const TimeDurationSchema = z.string().regex(/^PT(\d+H)?(\d+M)?$/);

// const RecipePredictionDataSchema = z.object({
//   activeTime: TimeDurationSchema,
//   cookTime: TimeDurationSchema,
//   totalTime: TimeDurationSchema,
//   yield: z.string(),
//   tags: z.array(z.string()),
//   ingredients: z.array(z.string()),
//   instructions: z.array(z.string()),
// });

export const RecipePredictionOutputSchema = z.object({
  recipe: z.object({
    activeTime: TimeDurationSchema,
    cookTime: TimeDurationSchema,
    totalTime: TimeDurationSchema,
    yield: z.string(),
    tags: z.array(z.string()),
    ingredients: z.array(z.string()),
    instructions: z.array(z.string()),
  }),
});

export const RemixPredictionOutputSchema = z.object({
  recipe: RecipePredictionOutputSchema.shape.recipe.merge(
    z.object({
      name: z.string(),
      description: z.string(),
    })
  ),
});

export const RecipePredictionPartialOutputSchema =
  RecipePredictionOutputSchema.deepPartial();

export const RemixPredictionPartialOutputSchema =
  RemixPredictionOutputSchema.deepPartial();

export const TempRecipeSchema = RecipeRequiredPropsSchema.merge(
  RecipePredictionOutputSchema.shape.recipe.partial()
).merge(
  z.object({
    fromPrompt: z.string().optional(),
    fromResult: z
      .object({
        resultId: z.string(),
        index: z.number(),
      })
      .optional(),
  })
);

const NewRecipeFromSuggestionsLiteral = z.literal(
  "NEW_RECIPE_FROM_SUGGESTIONS"
);

const NewInstantRecipeLiteral = z.literal("NEW_INSTANT_RECIPE");

export const NewInstantRecipePredictionInputSchema = z.object({
  type: NewInstantRecipeLiteral,
  recipe: z.object({
    name: z.string(),
    description: z.string(),
  }),
  prompt: z.string(),
});

export const NewRecipeFromSuggestionsPredictionInputSchema = z.object({
  type: NewRecipeFromSuggestionsLiteral,
  recipe: z.object({
    name: z.string(),
    description: z.string(),
  }),
  suggestionsInput: SuggestionPredictionInputSchema,
});

export const SousChefPredictionInputSchema = z.object({
  recipe: TempRecipeSchema.pick({ name: true, description: true }).merge(
    RecipePredictionOutputSchema.shape.recipe.pick({
      ingredients: true,
      tags: true,
      instructions: true,
    })
  ),
  prompt: z.string(),
});

export const ModifyRecipeDietaryPredictionInputSchema = z.object({
  type: ModifyRecipeDietaryLiteral,
  recipe: TempRecipeSchema.pick({ name: true, description: true }).merge(
    RecipePredictionOutputSchema.shape.recipe
  ),
  prompt: z.string(),
});

export const ModifyRecipeScalePredictionInputSchema = z.object({
  type: ModifyReicpeScaleLiteral,
  recipe: TempRecipeSchema.pick({ name: true, description: true }).merge(
    RecipePredictionOutputSchema.shape.recipe
  ),
  prompt: z.string(),
});

export const ModifyRecipeIngredientsPredictionInputSchema = z.object({
  type: ModifyRecipeIngredientsLiteral,
  recipe: TempRecipeSchema.pick({ name: true, description: true }).merge(
    RecipePredictionOutputSchema.shape.recipe
  ),
  prompt: z.string(),
});

export const ModifyRecipeFreeTextPredictionInputSchema = z.object({
  type: ModifyRecipeFreeTextLiteral,
  recipe: TempRecipeSchema.pick({ name: true, description: true }).merge(
    RecipePredictionOutputSchema.shape.recipe
  ),
  prompt: z.string(),
});

export const ModifyRecipeEquipmentPredictionInputSchema = z.object({
  type: ModifyRecipeEquipmentLiteral,
  recipe: TempRecipeSchema.pick({ name: true, description: true }).merge(
    RecipePredictionOutputSchema.shape.recipe
  ),
  prompt: z.string(),
});

export const RecipePredictionInputSchema = z.discriminatedUnion("type", [
  NewInstantRecipePredictionInputSchema,
  NewRecipeFromSuggestionsPredictionInputSchema,
]);

export const RemixPredictionInputSchema = z.discriminatedUnion("type", [
  ModifyRecipeScalePredictionInputSchema,
  ModifyRecipeIngredientsPredictionInputSchema,
  ModifyRecipeDietaryPredictionInputSchema,
  ModifyRecipeEquipmentPredictionInputSchema,
  ModifyRecipeFreeTextPredictionInputSchema,
]);

export const RecipeChatInputSchema = z.object({
  chatId: z.string(),
  recipe: TempRecipeSchema.optional(),
  recipeMessages: z.array(MessageSchema),
});

export const PromptSchema = z.string().nonempty().min(2).max(500);

export const CompletedRecipeSchema = RecipeRequiredPropsSchema.merge(
  RecipePredictionOutputSchema.shape.recipe
).merge(
  z.object({
    runStatus: z.literal("done"),
  })
);

export const RemixIdeasPredictionInputSchema = z.object({
  recipe: CompletedRecipeSchema,
});
export const FAQsPredictionInputSchema = z.object({
  recipe: RecipeSchema.pick({
    name: true,
    description: true,
    ingredients: true,
    instructions: true,
    tags: true,
  }),
});
export const RecipeProductsPredictionInputSchema = z.object({
  type: AmazonAffiliateProductSchema.shape.type,
  recipe: RecipeSchema.pick({
    name: true,
    description: true,
    ingredients: true,
    instructions: true,
    tags: true,
  }),
});

export const AmazonProductsPredictionInputSchema = z.object({
  type: AmazonAffiliateProductSchema.shape.type,
  recipe: RecipeSchema.pick({
    name: true,
    description: true,
    ingredients: true,
    instructions: true,
    tags: true,
  }),
  googleSearchText: z.string(),
});

export const InstantRecipeMetadataPredictionInputSchema = z.object({
  prompt: z.string(),
});
export const RemixRecipeMetadataPredictionInputSchema = z.object({
  prompt: z.string(),
  modification: z.string(),
  recipe: RecipeSchema,
});

export const TipsPredictionInputSchema = z.object({
  recipe: TempRecipeSchema.pick({ name: true, description: true }).merge(
    RecipePredictionOutputSchema.shape.recipe.pick({
      ingredients: true,
      tags: true,
      instructions: true,
    })
  ),
});

export const SubstitutionsPredictionInputSchema = z.object({
  recipe: CompletedRecipeSchema,
});
export const DietaryAlternativesPredictionInputSchema = z.object({
  recipe: CompletedRecipeSchema.pick({
    name: true,
    description: true,
    tags: true,
    ingredients: true,
    instructions: true,
  }),
});
export const EquipmentAdaptationsPredictionInputSchema = z.object({
  recipe: CompletedRecipeSchema,
});

export const SubstitutionsPredictionOutputSchema = z.object({
  substitutions: z.array(z.string().min(1)),
});

export const RecipeProductsPredictionOutputSchema = z.object({
  queries: z.array(z.string()),
});

export const AmazonProductsPredictionOutputSchema = z.object({
  products: z.array(
    z.object({
      name: z.string(),
      asin: z.string(),
    })
  ),
});

export const SubstitutionsPredictionPartialOutputSchema =
  SubstitutionsPredictionOutputSchema.deepPartial();

export const SuggestionsInputSchema = SuggestionPredictionInputSchema;
export const InstantRecipeMetdataInputSchema =
  InstantRecipeMetadataPredictionInputSchema;

export const SubstitutionsInputSchema = z.object({
  slug: z.string(),
});
export const DietaryAlternativesInputSchema = z.object({
  slug: z.string(),
});

export const EquipmentAdaptationsInputSchema = z.object({
  slug: z.string(),
});

export const GeneratorTypeSchema = z.enum(["suggestions"]);

export const ResultSchema = z.object({
  status: z.enum(["running", "error", "done"]),
  type: z.literal("suggestion"),
  input: SuggestionPredictionInputSchema,
  outputRaw: z.string(),
});

export const outputSchemaByType = {
  suggestion: SuggestionPredictionOutputSchema,
} as const;

export const SizeStringSchema = z
  .string()
  .regex(
    /^[0-9]+x[0-9]+\.png$/,
    "Size must be in the format WIDTHxHEIGHT.png with positive numbers"
  )
  .transform((input) => {
    const parts = input.split(".");
    if (parts.length !== 2 || parts[1] !== "png") {
      throw new Error("File extension must be .png");
    }

    const sizeWithoutExtension = parts[0]!;
    const [widthStr, heightStr] = sizeWithoutExtension.split("x");
    if (!widthStr || !heightStr) {
      throw new Error("Invalid size format");
    }

    const width = Number(widthStr);
    const height = Number(heightStr);

    return { width, height, extension: "png" };
  });

export const AmazonProductPageUrlSchema = z
  .string()
  .regex(
    /amazon\.com.*\/([a-zA-Z0-9]{10})(?:[\/\?]|$)/,
    "URL must be an Amazon product page URL containing a valid ASIN (10-character alphanumeric identifier)"
  )
  .transform((url) => {
    const asinMatch = url.match(/amazon\.com.*\/([a-zA-Z0-9]{10})(?:[\/\?]|$)/);
    if (!asinMatch || asinMatch.length < 2) {
      throw new Error("No valid ASIN found in Amazon URL");
    }

    return asinMatch[1];
  });
