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
  personalizationContext: string;
};

export type SuggestedInterestsOutput = z.infer<
  typeof SuggestedInterestsOutputSchema
>;

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

  protected async getUserMessage(
    input: SuggestedInterestsInput
  ): Promise<string> {
    console.log(input.personalizationContext);
    return input.personalizationContext;
  }

  protected async getSystemMessage(
    input: SuggestedInterestsInput
  ): Promise<string> {
    return `The user will provide sone information about themselves—please generate 20 kitchen topics for recipes they might be interested in, inspired the example list below:

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

Do not include variants on the same topic (e.g Air Fryer Breakfast, Air Fry Snacks, Air Fryer Appetizers) and do not overlay focus on any one thing—try to keep it varied and broad.
Avoid using the same same word in multiple of the same (e.g. Healthy, Flavorul, International, "Crowd-Pleasing", "Dinner Recipes").
Avoid overly specific interests like Brazilian Feijoada or Purevian Ceviche—focusing on just one dish.

Return exactly 20 interests.`;
  }

  protected getDefaultTokens(): number {
    return 1024;
  }
}
