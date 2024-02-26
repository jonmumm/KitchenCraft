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
    const TEMPLATE = `Given the user prompt, help me come up with a list of 6 suggestions:
4 of the suggestions should be ingredients;
1 of the suggestion should be an ingredient to exclude;
1 of the suggestions should be either a cooking style / origin, either instruments to use;
The prompt will be used to generate a recipe in a separate process.

===
Here is a set of example items to use as reference for things that might be helpful. Don't include back any items that are already included in the user prompt.

user prompt “bacon”
"bacon, 3 eggs"
“bacon, flour”

user prompt “curry dish”
“curry dish, traditional India”
“curry dish, not spicy”
“curry dish, shrimp”

user prompt “omelette”
“omelette, family main”
“omelette, decadent”
“omelette with coriander”

===

Format the response in YAML with a single key "items" and then the list of text strings to show as autocomplete suggestions. Append the user prompt before each of the items. Randomize the items order. Return nothing else but the formatted YAML.
`;

    return TEMPLATE;
  }

  protected getDefaultTokens(): number {
    return 1024;
  }
}
