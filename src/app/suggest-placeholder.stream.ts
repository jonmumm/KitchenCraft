import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { StructuredObjectStream } from "@/lib/structured-object-stream";
import { z, ZodSchema } from "zod";

export const SuggestPlaceholderOutputSchema = z.object({
  items: z.array(z.string()),
});

export type SuggestPlaceholderOutput = z.infer<typeof SuggestPlaceholderOutputSchema>;

export const SUGGEST_PLACEHOLDERS = "SUGGEST_PLACEHOLDERS";

export type SuggestPlaceholderEvent = StreamObservableEvent<
  typeof SUGGEST_PLACEHOLDERS,
  SuggestPlaceholderOutput
>;

export class SuggestPlaceholderStream extends StructuredObjectStream<
  { timeContext: string; personalizationContext: string },
  SuggestPlaceholderOutput
> {
  protected getSchema(): ZodSchema {
    return SuggestPlaceholderOutputSchema;
  }

  protected async getUserMessage(input: {
    timeContext: string;
    personalizationContext: string;
  }): Promise<string> {
    return `${input.timeContext} ${input.personalizationContext}`;
  }

  protected async getSystemMessage(_: {
    timeContext: string;
    personalizationContext: string;
  }): Promise<string> {
    const TEMPLATE = `Given the provided context about the current datetime, user's preferences and geographical information, help me come up with suggestive text I can use as a placeholder to extend the user's input that they have entered so far.
    The text should encourage the user to think about what they want to make by offering different ingredient or suggestions to use for the prompt. Here is a generic list of placeholders that could work given given no other information. 
    
"3 eggs"
"1lb ground beef"
"2 cups flour"
"pad thai"
"curry dish"
"pasta meal"
"chicken stew"
"veggie mix"
"family meal"
"6 servings"
"party size"
"omelette"
"pancakes"
"salad lunch"
"fruit snack"
"steak dinner"
"quick stir-fry"
"protein-rich"
"low-cal meal"
"heart healthy"
"keto snack"
"no nuts"
"dairy-free"
"gluten-free"
"lactose-free"
"bake bread"
"slow cooker"
"grilled fish"
"smoked ribs"
"kid-friendly"
"easy recipe"
"superfoods"
"without sugar"
"whole grain"
"roast veggies"
"grill bbq"
"feta, egg, leftover pizza"
"avocado, chocolate, chia seeds"
"spinach, blueberries, almonds"
"sweet potato, black beans, lime"
"bacon, maple syrup, pecans"
"quinoa, beets, goat cheese"
"apple, cinnamon, honey"
"salmon, soy sauce, ginger"
"chicken, peanut butter, sriracha"
"tomato, basil, mozzarella"
"pumpkin, coconut milk, curry powder"
"mushrooms, garlic, thyme"
"kale, avocado, lemon"
"shrimp, coconut, pineapple"
"lemon, raspberry, vanilla"
"zucchini, carrot, feta cheese"
"oats, banana, peanut butter"
"fig, balsamic vinegar, arugula"
"eggplant, tomato, ricotta"
"cucumber, dill, yogurt"

Return a list of 6 suggestions to be animated through as the input placeholder text. The suggestions should help guide the user to help spark ideas and encourage input.`;
    return TEMPLATE;
  }

  protected getName(): string {
    return SUGGEST_PLACEHOLDERS;
  }
}
