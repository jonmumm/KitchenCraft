import type { z } from "zod";
import ingredients from "./data/ingredients.json";
import {
  AppEventSchema,
  AssistantMessageSchema,
  CookingTimeSchema,
  CookwareSchema,
  CreateMessageInputSchema,
  CreateRecipeInputSchema,
  CuisineSchema,
  ModifyRecipeDietaryPredictionInputSchema,
  DietaryAlternativesInputSchema,
  DietaryAlternativesPredictionInputSchema,
  DishTypeSchema,
  EquipmentAdaptationsInputSchema,
  EquipmentAdaptationsPredictionInputSchema,
  FAQsPredictionInputSchema,
  GeneratorTypeSchema,
  IdeasPredictionOutputSchema,
  LLMMessageSetIdSchema,
  LLMMessageSetSchema,
  MessageContentSchema,
  MessageSchema,
  ModificationSchema,
  NewRecipeFromSuggestionsPredictionInputSchema,
  RecipeAttributeSchema,
  RecipeAttributesSchema,
  RecipeChatInputSchema,
  RecipePredictionInputSchema,
  RecipePredictionOutputSchema,
  RecipePredictionPartialOutputSchema,
  RecipeRequiredPropsSchema,
  TempRecipeSchema,
  RemixIdeasPredictionInputSchema,
  RemixIdeasPredictionOutputSchema,
  RemixIdeasPredictionPartialOutputSchema,
  RoleSchema,
  ModifyRecipeScalePredictionInputSchema,
  SlugSchema,
  SousChefPredictionInputSchema,
  ModifyRecipeIngredientsPredictionInputSchema,
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
  TipsPredictionInputSchema,
  TipsPredictionOutputSchema,
  TipsPredictionPartialOutputSchema,
  UserMessageSchema,
  ModifyRecipeEquipmentPredictionInputSchema,
  ModifyRecipeFreeTextPredictionInputSchema,
  NewInstantRecipePredictionInputSchema,
  InstantRecipeMetadataPredictionInputSchema,
  InstantRecipeMetdataInputSchema,
  InstantRecipeMetadataPredictionOutputSchema,
  UpvoteEventSchema,
  RemixRecipeMetadataPredictionInputSchema,
  RemixPredictionInputSchema,
  RemixPredictionOutputSchema,
  RemixPredictionPartialOutputSchema,
} from "./schema";


export type AppEvent = z.infer<typeof AppEventSchema>;

export type Ingredient = (typeof ingredients)[0];

export type Recipe = z.infer<typeof TempRecipeSchema>;
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
export type RemixPredictionOutput = z.infer<
  typeof RemixPredictionOutputSchema
>;
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
