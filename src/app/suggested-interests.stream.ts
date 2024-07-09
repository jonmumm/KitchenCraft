import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { StructuredObjectStream } from "@/lib/structured-object-stream";
import { z } from "zod";
// import { getPreferences } from "./quiz/preferences/constants";

export const SuggestedInterestsOutputSchema = z.object({
  interests: z
    .array(z.string())
    .describe(
      "A list of 20 kitchen/cooking related topics that the person might be interested in"
    ),
});

const SUGGESTED_INTERESTS = "SUGGESTED_INTERESTS";

export type SuggestedInterestsEvent = StreamObservableEvent<
  typeof SUGGESTED_INTERESTS,
  z.infer<typeof SuggestedInterestsOutputSchema>
>;

export type SuggestedInterestsInput = {
  preferences: Record<number, number>;
  personalizationContext: string;
};

export type SuggestedInterestsOutput = z.infer<typeof SuggestedInterestsOutputSchema>;

export class SuggestedInterestsStream extends StructuredObjectStream<
  SuggestedInterestsInput,
  SuggestedInterestsOutput
> {
  protected getSchema(): z.ZodType<
    SuggestedInterestsOutput,
    z.ZodTypeDef,
    SuggestedInterestsOutput
  > {
    return SuggestedInterestsOutputSchema;
  }

  protected getName(): string {
    return SUGGESTED_INTERESTS;
  }

  protected async getUserMessage(input: SuggestedInterestsInput): Promise<string> {
    return `
Personalization Context: ${input.personalizationContext}
    `;
  }

  protected async getSystemMessage(input: SuggestedInterestsInput): Promise<string> {
    return `Please generate topics that someone might be interset in, inspired the example list below, loosely based on the user's provided preferences and personalization context.

Keto Dinners
Vegan Comfort Foods
Instant Pot
Air Fryer
Oven Roasted Meals
Wok Stir Fry
From The Freezer
Toaster Oven Snacks
High-Protein Breakfasts
Gluten-Free Baking
Slow Cooker Favorites
Family-Friendly Meals
Sheet-Pan Dinners
Seasonal Vegetables
Budget-Friendly Dishes
Fresh Salads
Hearty Soups

Do not include variants on the same topic (e.g Air Fryer Breakfast, Air Fry Snacks, Air Fryer Appetizers) and do not overlay focus on any one question/preference/topic.
Avoid using the same same word in multiple topics (e.g. Healthy, Flavorul, International, "Crowd-Pleasing", "Dinner Recipes").
Avoid overly specific topics like Brazilian Feijoada or Purevian Ceviche—focusing on just one dish.

Return exactly 20 topics.`;
  }

  protected getDefaultTokens(): number {
    return 1024;
  }
}
