import { DeepPartial } from "ai";
import { PgTransaction } from "drizzle-orm/pg-core";
import { Operation } from "fast-json-patch";
import type * as Party from "partykit/server";
import { PostHog } from "posthog-node";
import { Observable } from "rxjs";
import { AnyStateMachine, SnapshotFrom } from "xstate";
import type { z } from "zod";
import { HomepageCategoriesEvent } from "./app/homepage-categories.stream";
import { GoogleCustomSearchResponseSchema } from "./app/recipe/[slug]/products/schema";
import { SuggestIngredientsEvent } from "./app/suggest-ingredients.stream";
import { SuggestPlaceholderEvent } from "./app/suggest-placeholder.stream";
import { SuggestTagsEvent } from "./app/suggest-tags.stream";
import { SuggestTokensEvent } from "./app/suggest-tokens.stream";
import ingredients from "./data/ingredients.json";
import {
  AffiliateProductSchema,
  AmazonAffiliateProductSchema,
  ListSchema,
  NewAffiliateProductSchema,
  NewAmazonAffiliateProductSchema,
  NewProfileSchema,
  NewRecipeCommentSchema,
  ProfileSchema,
  RecipeCommentSchema,
  UserPreferenceSchema,
  db,
  featureIdEnum,
} from "./db";
import {
  AdContextSchema,
  // AdDisplaySchema,
  AmazonProductsPredictionInputSchema,
  AppEventSchema,
  AssistantMessageSchema,
  CallerIdTypeSchema,
  CookingTimeSchema,
  CookwareSchema,
  CreateMessageInputSchema,
  CreateRecipeInputSchema,
  CuisineSchema,
  DietSettingsSchema,
  DietaryAlternativesInputSchema,
  DietaryAlternativesPredictionInputSchema,
  DishTypeSchema,
  EquipmentAdaptationsInputSchema,
  EquipmentAdaptationsPredictionInputSchema,
  EquipmentSettingsSchema,
  ExperienceLevelSchema,
  FAQsPredictionInputSchema,
  FeedItemSchema,
  GeneratorTypeSchema,
  IdeasPredictionOutputSchema,
  InstantRecipeMetadataPredictionInputSchema,
  InstantRecipeMetadataPredictionOutputSchema,
  InstantRecipeMetdataInputSchema,
  LLMMessageSetIdSchema,
  LLMMessageSetSchema,
  MediaFragmentLiteralSchema,
  MessageContentSchema,
  MessageSchema,
  ModificationSchema,
  ModifyRecipeDietaryPredictionInputSchema,
  ModifyRecipeEquipmentPredictionInputSchema,
  ModifyRecipeFreeTextPredictionInputSchema,
  ModifyRecipeIngredientsPredictionInputSchema,
  ModifyRecipeScalePredictionInputSchema,
  NewInstantRecipePredictionInputSchema,
  NewRecipeFromSuggestionsPredictionInputSchema,
  OnboardingInputSchema,
  ProfileSlugSchema,
  RecipeAttributeSchema,
  RecipeAttributesSchema,
  RecipeBaseSchema,
  RecipeChatInputSchema,
  RecipePredictionInputSchema,
  RecipePredictionOutputSchema,
  RecipePredictionPartialOutputSchema,
  RecipeProductsPredictionInputSchema,
  RecipeProductsPredictionOutputSchema,
  RecipeRequiredPropsSchema,
  RemixEventSchema,
  RemixIdeasPredictionInputSchema,
  RemixIdeasPredictionOutputSchema,
  RemixIdeasPredictionPartialOutputSchema,
  RemixPredictionInputSchema,
  RemixPredictionOutputSchema,
  RemixPredictionPartialOutputSchema,
  RemixRecipeMetadataPredictionInputSchema,
  RemixSuggestionsPredictionInputSchema,
  RoleSchema,
  SlugSchema,
  SousChefPredictionInputSchema,
  SubstitutionsInputSchema,
  SubstitutionsPredictionInputSchema,
  SubstitutionsPredictionOutputSchema,
  SubstitutionsPredictionPartialOutputSchema,
  SuggestionPredictionInputSchema,
  SuggestionPredictionOutputSchema,
  SuggestionPredictionPartialOutputSchema,
  SuggestionSchema,
  SuggestionsInputSchema,
  SystemEventSchema,
  SystemMessageSchema,
  TasteSettingsSchema,
  TechniqueSchema,
  TempRecipeSchema,
  TipsAndTricksPredictionInputSchema,
  TipsPredictionInputSchema,
  TipsPredictionOutputSchema,
  TipsPredictionPartialOutputSchema,
  UpvoteEventSchema,
  UserMessageSchema,
} from "./schema";

// Define a type utility to extract the type based on the `type` property
export type ExtractType<T, TypeString> = T extends { type: infer U }
  ? U extends TypeString
    ? T
    : never
  : never;

export type CamelCase<S extends string> =
  S extends `${infer P}_${infer Q}${infer R}`
    ? `${P}${Capitalize<CamelCase<`${Q}${R}`>>}`
    : S;
export type Camelize<T> = {
  [K in keyof T as CamelCase<K & string>]: T[K] extends object
    ? Camelize<T[K]>
    : T[K];
};
export type UnArray<T> = T extends Array<infer U> ? U : T;

export type CloudFlareProps = Party.Request["cf"];

export type AppEvent = z.infer<typeof AppEventSchema>;
export type SystemEvent = z.infer<typeof SystemEventSchema>;

export type CallerType = z.infer<typeof CallerIdTypeSchema>;
export type Caller = { id: string; type: CallerType };
export type WithCaller<T> = T & { caller: Caller };
export type WithCloudFlareProps<T> = T & { cf?: CloudFlareProps };
export type WithPostHogClient<T> = T & { postHogClient: PostHog };
export type Ingredient = (typeof ingredients)[0];

export type ExtractAppEvent<T extends AppEvent["type"]> = Extract<
  AppEvent,
  { type: T }
>;

export type TempRecipe = z.infer<typeof TempRecipeSchema>;
export type DishType = z.infer<typeof DishTypeSchema>;
export type CookingTime = z.infer<typeof CookingTimeSchema>;
export type Cookware = z.infer<typeof CookwareSchema>;
export type Technique = z.infer<typeof TechniqueSchema>;
export type Cuisine = z.infer<typeof CuisineSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type AssistantMessage = z.infer<typeof AssistantMessageSchema>;

export type RecipeAttributes = z.infer<typeof RecipeAttributesSchema>;
export type RecipeAttribute = z.infer<typeof RecipeAttributeSchema>;

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
export type RecipeViewerData = z.infer<
  typeof RecipePredictionPartialOutputSchema
>;

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
export type RemixPredictionInput = z.infer<typeof RemixPredictionInputSchema>;
export type RecipePredictionOutput = z.infer<
  typeof RecipePredictionOutputSchema
>;
export type RemixPredictionOutput = z.infer<typeof RemixPredictionOutputSchema>;
export type RecipePredictionPartialOutput = z.infer<
  typeof RecipePredictionPartialOutputSchema
>;
export type RemixPredictionPartialOutput = z.infer<
  typeof RemixPredictionPartialOutputSchema
>;

export type Suggestion = z.infer<typeof SuggestionSchema>;

export type RemixIdeasPredictionInput = z.infer<
  typeof RemixIdeasPredictionInputSchema
>;
export type FAQsPredictionInput = z.infer<typeof FAQsPredictionInputSchema>;
export type RemixSuggestionsPredictionInput = z.infer<
  typeof RemixSuggestionsPredictionInputSchema
>;
export type TipsAndTricksPredictionInput = z.infer<
  typeof TipsAndTricksPredictionInputSchema
>;
export type InstantRecipeMetadataPredictionInput = z.infer<
  typeof InstantRecipeMetadataPredictionInputSchema
>;
export type RemixRecipeMetadataPredictionInput = z.infer<
  typeof RemixRecipeMetadataPredictionInputSchema
>;
export type InstantRecipeMetadataPredictionOutput = z.infer<
  typeof InstantRecipeMetadataPredictionOutputSchema
>;
export type RemixIdeasPredictionOutput = z.infer<
  typeof RemixIdeasPredictionOutputSchema
>;
export type RemixIdeasPredictionPartialOutput = z.infer<
  typeof RemixIdeasPredictionPartialOutputSchema
>;

export type TipsPredictionInput = z.infer<typeof TipsPredictionInputSchema>;
export type TipsPredictionOutput = z.infer<typeof TipsPredictionOutputSchema>;
export type TipsPredictionPartialOutput = z.infer<
  typeof TipsPredictionPartialOutputSchema
>;

export type Modification = z.infer<typeof ModificationSchema>;

export type IdeasPredictionOutput = z.infer<typeof IdeasPredictionOutputSchema>;
export type RecipeProductsPredictionInput = z.infer<
  typeof RecipeProductsPredictionInputSchema
>;
export type RecipeProductsPredictionOutput = z.infer<
  typeof RecipeProductsPredictionOutputSchema
>;

export type SubstitutionsPredictionInput = z.infer<
  typeof SubstitutionsPredictionInputSchema
>;
export type SubstitutionsPredictionOutput = z.infer<
  typeof SubstitutionsPredictionOutputSchema
>;
export type SubstitutionsPredictionPartialOutput = z.infer<
  typeof SubstitutionsPredictionPartialOutputSchema
>;

export type NewInstantRecipePredictionInput = z.infer<
  typeof NewInstantRecipePredictionInputSchema
>;
export type NewRecipeFromSuggestionsPredictionInput = z.infer<
  typeof NewRecipeFromSuggestionsPredictionInputSchema
>;
export type ScaleRecipePredictionInput = z.infer<
  typeof ModifyRecipeScalePredictionInputSchema
>;
export type DietaryAlternativesPredictionInputSchema = z.infer<
  typeof DietaryAlternativesPredictionInputSchema
>;
export type EquipmentAdaptationsPredictionInput = z.infer<
  typeof EquipmentAdaptationsPredictionInputSchema
>;
export type AmazonProductsPredictionInput = z.infer<
  typeof AmazonProductsPredictionInputSchema
>;
export type SubstituteRecipePredictionInput = z.infer<
  typeof ModifyRecipeIngredientsPredictionInputSchema
>;
export type DietaryAlternativeRecipePredictionInput = z.infer<
  typeof ModifyRecipeDietaryPredictionInputSchema
>;
export type EquipmentAdaptationRecipePredictionInput = z.infer<
  typeof EquipmentAdaptationsPredictionInputSchema
>;

export type InstantRecipeMetdataInput = z.infer<
  typeof InstantRecipeMetdataInputSchema
>;
export type SuggestionsInput = z.infer<typeof SuggestionsInputSchema>;
export type SubstitutionsInput = z.infer<typeof SubstitutionsInputSchema>;
export type DietaryAlternativesInput = z.infer<
  typeof DietaryAlternativesInputSchema
>;
export type EquipmentAdaptationsInput = z.infer<
  typeof EquipmentAdaptationsInputSchema
>;

export type GeneratorType = z.infer<typeof GeneratorTypeSchema>;
export type RecipeRequiredProps = z.infer<typeof RecipeRequiredPropsSchema>;

export type DietaryAlternativesPredictionInput = z.infer<
  typeof DietaryAlternativesPredictionInputSchema
>;
export type SousChefPredictionInput = z.infer<
  typeof SousChefPredictionInputSchema
>;

export type ModifyRecipeIngredientsPredictionInput = z.infer<
  typeof ModifyRecipeIngredientsPredictionInputSchema
>;
export type ModifyRecipeScalePredictionInput = z.infer<
  typeof ModifyRecipeScalePredictionInputSchema
>;
export type ModifyRecipeFreeTextPredictionInput = z.infer<
  typeof ModifyRecipeFreeTextPredictionInputSchema
>;
export type ModifyRecipeEquipmentPredictionInput = z.infer<
  typeof ModifyRecipeEquipmentPredictionInputSchema
>;
export type ModifyRecipeDietaryPredictionInput = z.infer<
  typeof ModifyRecipeDietaryPredictionInputSchema
>;

export type UpvoteEvent = z.infer<typeof UpvoteEventSchema>;
export type RemixEvent = z.infer<typeof RemixEventSchema>;

export type ProfileSlug = z.infer<typeof ProfileSlugSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type NewProfile = z.infer<typeof NewProfileSchema>;

export type GoogleCustomSearchResponse = z.infer<
  typeof GoogleCustomSearchResponseSchema
>;
export type AmazonAffiliateProduct = z.infer<
  typeof AmazonAffiliateProductSchema
>;
export type NewAmazonAffiliateProduct = z.infer<
  typeof NewAmazonAffiliateProductSchema
>;

export type ProductType = AmazonAffiliateProduct["type"];

export type DbOrTransaction = typeof db | PgTransaction<any, any, any>; // Adjust the types accordingly

export type ObservableType<T> = T extends Observable<infer U> ? U : never;

export type RecipeBase = z.infer<typeof RecipeBaseSchema>;

export type FeatureId = (typeof featureIdEnum.enumValues)[number];

export type MediaFragmentLiteral = z.infer<typeof MediaFragmentLiteralSchema>;
export type RecipeComment = z.infer<typeof RecipeCommentSchema>;
export type NewRecipeComment = z.infer<typeof NewRecipeCommentSchema>;

export type AdContext = z.infer<typeof AdContextSchema>;
// export type AdDisplay = z.infer<typeof AdDisplaySchema>;
export type AffiliateProduct = z.infer<typeof AffiliateProductSchema>;
export type NewAffiliateProduct = z.infer<typeof NewAffiliateProductSchema>;

export type PartialRecipe = {
  id: string;
  versionId: number;
  name?: string;
  slug?: string;
  description?: string;
  tags?: string[];
  yield?: string;
  ingredients?: string[];
  instructions?: string[];
  cookTime?: string;
  totalTime?: string;
  activeTime?: string;
};

export type AdInstance = {
  id: string;
  context: AdContext;
  product?: AffiliateProduct;
};

export type UserPreference = z.infer<typeof UserPreferenceSchema>;
export type UserPreferenceType = UserPreference["preferenceKey"];
export type UserPreferences = {
  [K in UserPreferenceType]+?: string;
};

export type RecipeList = z.infer<typeof ListSchema>;

export type ServerPartySocket = Awaited<
  ReturnType<
    ReturnType<Party.Context["parties"]["browser_sessions"]["get"]>["socket"]
  >
>;

export type OnboardingInput = z.infer<typeof OnboardingInputSchema>;

export type ExperienceLevel = z.infer<typeof ExperienceLevelSchema>;
export type EquipmentSettings = z.infer<typeof EquipmentSettingsSchema>;
export type DietSettings = z.infer<typeof DietSettingsSchema>;
export type TasteSettings = z.infer<typeof TasteSettingsSchema>;

export type BrowserSessionEvent =
  | WithCaller<AppEvent>
  | WithCaller<SystemEvent>
  | SuggestTagsEvent
  | SuggestPlaceholderEvent
  | SuggestTokensEvent
  | SuggestIngredientsEvent
  | HomepageCategoriesEvent;

type FeedItemRecipe = UnArray<FeedItem["recipes"]>;
type FeedItemRecipeWithId = FeedItemRecipe & {
  id: string;
};

// New CategoryWithId type that extends Category and ensures recipes have an id
type FeedWithRecipeIds = Omit<FeedItem, "recipes"> & {
  recipes: FeedItemRecipeWithId[];
};

type FeedItemWithIds = { id: string } & DeepPartial<FeedWithRecipeIds>;

export type BrowserSessionContext = {
  id: string;
  userId: string;
  experienceLevel?: ExperienceLevel;
  groceryStores?: string;
  shoppingFrequency?: string;
  typicalGroceries?: string;
  selectedRecipeIds: string[];
  selectedListId?: string;
  equipment: EquipmentSettings;
  diet: DietSettings;
  preferences: TasteSettings;
  timezone?: string;
  country?: string;
  continent?: string;
  city?: string;
  postalCode?: string;
  gps?: {
    latitude: string;
    longitude: string;
  };
  region?: string;
  regionCode?: string;
  suggestedIngredients: Array<string>;
  suggestedTags: Array<string>;
  lastRunPersonalizationContext: string | undefined; // todo put this on the store instead of context?
  suggestedPlaceholders: Array<string>;
  suggestedTokens: Array<string>;
  feedItems: Record<string, FeedItemWithIds>;
  feedItemIds: string[];
  listIds: string[];
  listsById: Record<
    string,
    {
      id: string;
      name?: string;
      slug?: string;
      isPublic: boolean;
      totalItems: number;
      items: {
        ids: string[];
        offset: number;
        hasMore: boolean;
      };
    }
  >;
};

type WithConnect<T extends string> = `${T}_CONNECT`;
type WithUpdate<T extends string> = `${T}_UPDATE`;
type WithDisconnect<T extends string> = `${T}_DISCONNECT`;
type WithError<T extends string> = `${T}_ERROR`;

export type ActorSocketEvent<
  TEventType extends string,
  TMachine extends AnyStateMachine,
> =
  | {
      type: WithConnect<TEventType>;
      resultId: string;
    }
  | {
      type: WithUpdate<TEventType>;
      snapshot: SnapshotFrom<TMachine>;
      operations: Operation[];
    }
  | {
      type: WithError<TEventType>;
    }
  | {
      type: WithDisconnect<TEventType>;
    };

export type FeedItem = z.infer<typeof FeedItemSchema>;
