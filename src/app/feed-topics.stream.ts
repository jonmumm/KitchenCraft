import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { StructuredObjectStream } from "@/lib/structured-object-stream";
import { z } from "zod";
// import { getPreferences } from "./quiz/preferences/constants";

export const FeedTopicsOutputSchema = z.object({
  topics: z
    .array(z.string())
    .describe(
      "A list of 20 topics that this person might be interested in."
    ),
});

const FEED_TOPICS = "FEED_TOPICS";

export type FeedTopicsEvent = StreamObservableEvent<
  typeof FEED_TOPICS,
  z.infer<typeof FeedTopicsOutputSchema>
>;

export type FeedTopicsInput = {
  preferences: Record<number, number>;
  personalizationContext: string;
};

export type FeedTopicsOutput = z.infer<typeof FeedTopicsOutputSchema>;

export class FeedTopicsStream extends StructuredObjectStream<
  FeedTopicsInput,
  FeedTopicsOutput
> {
  protected getSchema(): z.ZodType<
    FeedTopicsOutput,
    z.ZodTypeDef,
    FeedTopicsOutput
  > {
    return FeedTopicsOutputSchema;
  }

  protected getName(): string {
    return FEED_TOPICS;
  }

  protected async getUserMessage(input: FeedTopicsInput): Promise<string> {
    return `
Personalization Context: ${input.personalizationContext}
    `;
  }

  protected async getSystemMessage(input: FeedTopicsInput): Promise<string> {
    return `Please generate topics inspired the example list below, loosely based on the user's preferences and personalization context.

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
Seasonal Vegetables
Budget-Friendly Dishes
Quick Weeknight Dinners
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
