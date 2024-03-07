import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { TokenStream } from "@/lib/token-stream";
import { z } from "zod";

export const AutoSuggestPlaceholderOutputSchema = z.object({
  items: z.array(z.string()),
});

export type AutoSuggestPlaceholderEvent = StreamObservableEvent<
  "PLACEHOLDER",
  z.infer<typeof AutoSuggestPlaceholderOutputSchema>
>;

export class AutoSuggestPlaceholderStream extends TokenStream<{
  prompt: string;
}> {
  protected async getUserMessage(input: { prompt: string }): Promise<string> {
    return input.prompt;
  }

  protected async getSystemMessage(_: { prompt: string }): Promise<string> {
    const TEMPLATE = `Given the user prompt, help me come up with suggestive text I can use as a placeholder. The text should encourage the user to think about what they want to make by offering different ingredient or suggestions to use for the prompt. Here is a generic list of placeholders that could work given given no other information. 
    
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

Incorporate the users prompt and return a list of 6 suggestions to be animated through as the input placeholder text. The suggestions should help guide the user to further ideate/refine the recipe they are crafting.

Format the response in YAML with a single key "items" and then the list of text strings to show as autocomplete suggestions. Return nothing else but the formatted YAML.`;
    return TEMPLATE;
  }

  protected getDefaultTokens(): number {
    return 1024;
  }
}
