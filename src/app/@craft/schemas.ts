import {
  IdeasPredictionOutputSchema,
  IdeasPredictionPartialOutputSchema,
  SubstitutionsPredictionPartialOutputSchema,
  SuggestionPredictionPartialOutputSchema,
} from "@/schema";
import { RefObject } from "react";
import { z } from "zod";

export const ContextSchema = z.object({
  prompt: z.string().nullable(),
  ingredients: z.array(z.string()).nullable(),
  tags: z.array(z.string()).nullable(),
  slug: z.string().nullable(),
  suggestions:
    SuggestionPredictionPartialOutputSchema.shape.suggestions.nullable(),
  substitutions: SubstitutionsPredictionPartialOutputSchema.shape.substitutions,
  equipmentAdaptations: IdeasPredictionPartialOutputSchema.shape.ideas,
  dietaryAlternatives: IdeasPredictionPartialOutputSchema.shape.ideas,
  scrollViewRef: z.custom<RefObject<HTMLDivElement>>(),
  resultId: z.string().nullable(),
});
