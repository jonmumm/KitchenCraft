import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { TokenStream } from "@/lib/token-stream";
import { SuggestionPredictionInput } from "@/types";
import { z } from "zod";

const ItemSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const AutoSuggestRecipesOutputSchema = z.object({
  recipes: z.array(ItemSchema),
});

export const AutoSuggestRecipesEventBase = "AUTO_SUGGEST_RECIPES";

export type AutoSuggestRecipesEvent = StreamObservableEvent<
  typeof AutoSuggestRecipesEventBase,
  z.infer<typeof AutoSuggestRecipesOutputSchema>
>;

export class AutoSuggestRecipesStream extends TokenStream<SuggestionPredictionInput> {
  protected async getUserMessage(
    input: SuggestionPredictionInput
  ): Promise<string> {
    let prompt = input.prompt + "\n";
    // Construct the prompt based on the input
    if (input.ingredients) {
      prompt += `ingredients: ${input.ingredients.join(",")}`;
    }

    if (input.tags) {
      prompt += `tags: ${input.tags.join(",")}`;
    }

    return prompt;
  }

  protected async getSystemMessage(
    input: SuggestionPredictionInput
  ): Promise<string> {
    // Construct and return the template
    return CHAIN_TEMPLATE; // Or construct it dynamically based on `input` if needed
  }

  // Optionally, if you need a different number of tokens for suggestions, override the getDefaultTokens method
  protected getDefaultTokens(): number {
    return 1024; // Set the default token count specific for suggestion token streams
  }
}

const CHAIN_TEMPLATE = `
You will be provided with an input related to food – this can include ingredients, cooking techniques, or other culinary themes. Your task is to generate six recipes that involve the given input.

Format the response in a YAML block. Each recipe suggestion should have both a 'name' and a 'description'. The top-level key should be "recipes". Ensure the YAML format has appropriate white space for the list items under recipes.

\`\`\`yaml
recipes:
  - name: Recipe Name 1
    description: Description of recipe 1.
  - name: Recipe Name 2
    description: Description of recipe 2.
  ... [and so forth for all six recipes]
\`\`\`

Example: 

\`\`\`yaml
recipes:
  - name: "Feta Omelette"
    description: "Fluffy eggs, crumbled feta, spinach, tomatoes. Breakfast classic."
  - name: "Egg Feta Muffins"
    description: "Whisked eggs, feta, veggies. Baked in muffin tins."
  - name: "Spinach Egg Pie"
    description: "Layered phyllo, spinach, eggs, feta. Golden crust delight."
  - name: "Feta Scramble"
    description: "Soft scrambled eggs, feta, herbs. Creamy and savory."
  - name: "Egg Feta Tart"
    description: "Shortcrust, eggs, feta, olives. Mediterranean-inspired pastry."
  - name: "Egg-Feta Soufflé"
    description: "Airy eggs, feta. Puffed up gourmet elegance."
\`\`\``;
