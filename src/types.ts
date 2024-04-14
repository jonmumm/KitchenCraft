import { PgTransaction } from "drizzle-orm/pg-core";
import { Observable } from "rxjs";
import type { z } from "zod";
import { GoogleCustomSearchResponseSchema } from "./app/recipe/[slug]/products/schema";
import ingredients from "./data/ingredients.json";
import {
  AffiliateProductSchema,
  AmazonAffiliateProductSchema,
  NewAffiliateProductSchema,
  NewAmazonAffiliateProductSchema,
  NewProfileSchema,
  NewRecipeCommentSchema,
  ProfileSchema,
  RecipeCommentSchema,
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
  DietaryAlternativesInputSchema,
  DietaryAlternativesPredictionInputSchema,
  DishTypeSchema,
  EquipmentAdaptationsInputSchema,
  EquipmentAdaptationsPredictionInputSchema,
  FAQsPredictionInputSchema,
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
  SystemMessageSchema,
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

export type AppEvent = z.infer<typeof AppEventSchema>;

export type CallerType = z.infer<typeof CallerIdTypeSchema>;
export type Caller = { id: string; type: CallerType };
export type WithCaller<T> = T & { caller: Caller };
export type Ingredient = (typeof ingredients)[0];

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
