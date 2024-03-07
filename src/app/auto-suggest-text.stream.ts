import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { TokenStream } from "@/lib/token-stream";
import { z } from "zod";

export const AutoSuggestTextOutputSchema = z.object({
  items: z.array(z.string()),
});

export type AutoSuggestTextEvent = StreamObservableEvent<
  "TEXT",
  z.infer<typeof AutoSuggestTextOutputSchema>
>;

export class AutoSuggestTextStream extends TokenStream<{ prompt: string }> {
  protected async getUserMessage(input: { prompt: string }): Promise<string> {
    return input.prompt;
  }

  protected async getSystemMessage(_: { prompt: string }): Promise<string> {
    const TEMPLATE = `Given the user prompt, help me come up with a list of 6 suggestions to provide back to the user as autocomplete suggestions to guide them as they are crafting an idea for a new recipe.

Here is a wide-ranging set of example items to use as reference for things that might be helpful. Don't include back any items that are already included in the user prompt.

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

Format the response in YAML with a single key "items" and then the list of text strings to show as autocomplete suggestions. Return nothing else but the formatted YAML.
`;

    return TEMPLATE;
  }

  protected getDefaultTokens(): number {
    return 1024;
  }
}
