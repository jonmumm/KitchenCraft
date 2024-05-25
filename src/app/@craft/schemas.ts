import {
  IdeasPredictionPartialOutputSchema,
  InstantRecipeMetadataPredictionOutputSchema,
  SubstitutionsPredictionPartialOutputSchema,
  SuggestionPredictionPartialOutputSchema,
} from "@/schema";
import { z } from "zod";

export const ContextSchema = z.object({
  // currentItemIndex: z.number(),
  // tokens: z.array(z.string()),
  token: z.string(),
  scrollItemIndex: z.number(),
  savedRecipeSlugs: z.array(z.string()),
  currentRecipeUrl: z.string().optional(),
  currentRemixSlug: z.string().optional(),
  focusedRecipeId: z.string().optional(),
  prompt: z.string(),
  ingredients: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  selection: z
    .object({
      name: z.string(),
      description: z.string(),
    })
    .optional(),
  // slug: z.string().nullable(),
  suggestions:
    SuggestionPredictionPartialOutputSchema.shape.suggestions.nullable(),
  remixSuggestions:
    SuggestionPredictionPartialOutputSchema.shape.suggestions.nullable(),
  substitutions: SubstitutionsPredictionPartialOutputSchema.shape.substitutions,
  equipmentAdaptations: IdeasPredictionPartialOutputSchema.shape.ideas,
  dietaryAlternatives: IdeasPredictionPartialOutputSchema.shape.ideas,
  // scrollViewRef: z.custom<RefObject<HTMLDivElement>>(),
  // resultId: z.string().nullable(),
  suggestionsResultId: z.string().optional(),
  instantRecipeResultId: z.string().optional(),
  instantRecipeMetadata:
    InstantRecipeMetadataPredictionOutputSchema.partial().optional(),
  socketToastId: z.union([z.string(), z.number()]).optional(),
});
