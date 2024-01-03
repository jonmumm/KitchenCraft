import {
  IdeasPredictionOutputSchema,
  IdeasPredictionPartialOutputSchema,
  InstantRecipeMetadataPredictionOutputSchema,
  SubstitutionsPredictionPartialOutputSchema,
  SuggestionPredictionPartialOutputSchema,
} from "@/schema";
import { RefObject } from "react";
import { AnyActorRef } from "xstate";
import { z } from "zod";

export const ContextSchema = z.object({
  currentItemIndex: z.number().optional(),
  currentRecipeUrl: z.string().optional(),
  currentRemixSlug: z.string().optional(),
  prompt: z.string().optional(),
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
  submittedInputHash: z.string().optional(),
  suggestionsResultId: z.string().optional(),
  instantRecipeResultId: z.string().optional(),
  instantRecipeMetadata:
    InstantRecipeMetadataPredictionOutputSchema.partial().optional(),
});
