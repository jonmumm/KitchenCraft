import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { TokenStream } from "@/lib/token-stream";
import { z } from "zod";

export const SuggestListNamesOutputSchema = z.object({
  names: z.array(z.string()),
});

export type SuggestListNamesEvent = StreamObservableEvent<
  "SUGGEST_LIST_NAMES",
  z.infer<typeof SuggestListNamesOutputSchema>
>;

export class SuggestListNamesStream extends TokenStream<{
  previousSuggestions: string[];
  prompt: string;
  tokens: string[];
  selectedRecipe: {
    name: string;
    description: string;
  };
}> {
  protected async getUserMessage(input: {
    previousSuggestions: string[];
    prompt: string;
    tokens: string[];
    selectedRecipe: { name: string; description: string };
  }): Promise<string> {
    let parts = [];

    if (input.previousSuggestions.length > 0) {
      parts.push(
        "Previous Suggestions: " + input.previousSuggestions.join(", ")
      );
    }

    if (input.prompt) {
      parts.push("Prompt: " + input.prompt);
    }

    if (input.tokens.length > 0) {
      parts.push("Tokens: " + input.tokens.join(", "));
    }

    const recipeText = `Selected Recipe - Name: ${input.selectedRecipe.name}, Description: ${input.selectedRecipe.description}`;
    parts.push(recipeText);

    return parts.join(", ");
  }

  protected async getSystemMessage(input: {
    previousSuggestions: string[];
    prompt: string;
    tokens: string[];
    selectedRecipe: { name: string; description: string };
  }): Promise<string> {
    const TEMPLATE = `Generate names for recipe lists that might include these dishes. Here are three examples names showing what list names might be appropriate for a given prompt and selected recipe. 

1. Prompt: 'Cheese'
   Selected Recipe: 'Grilled Cheese'
   Recipe List Names:
   - Comfort Food Classics
   - Quick Lunch Fixes
   - Cheesy Delights
   - Kid-Friendly Meals
   - Easy Weekend Lunches
   - Toasty Sandwich Night

2. Prompt: 'Chocolate'
   Selected Recipe: 'Chocolate Chip Cookies'
   Recipe List Names:
   - Baking with Kids
   - Sweet Treats
   - Holiday Baking Favorites
   - Cookie Jar Fillers
   - Dessert Night Specials
   - Weekend Baking Projects

3. Prompt: 'Steak'
   Selected Recipe: 'Reverse-Seared Ribeye Steak'
   Recipe List Names:
   - Weekend BBQ Favorites
   - Friday Night Dinner
   - Special Occasion Meals
   - Grilling Masterpieces
   - Steakhouse at Home
   - Summer Grill Outs

These names should be relevant to the dish in the prompt and suitable for various culinary occasions. Each set should contain 6 names. Format the response in YAML with a single key 'names' listing the suggestions for all scenarios. Return only the formatted YAML with 6 suggestions in total.`;
    return TEMPLATE;
  }

  protected getDefaultTokens(): number {
    return 1024;
  }
}
