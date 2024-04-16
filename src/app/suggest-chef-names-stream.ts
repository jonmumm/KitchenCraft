import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { TokenStream } from "@/lib/token-stream";
import { z } from "zod";

export const SuggestChefNamesOutputSchema = z.object({
  names: z.array(z.string()),
});

export type SuggestChefNamesEvent = StreamObservableEvent<
  "SUGGEST_CHEF_NAMES",
  z.infer<typeof SuggestChefNamesOutputSchema>
>;

export class SuggestChefNamesStream extends TokenStream<{
  email: string;
  previousSuggestions: string[];
  prompt: string;
  tokens: string[];
  selectedRecipe: {
    name: string;
    description: string;
  };
}> {
  protected async getUserMessage(input: {
    email: string;
    previousSuggestions: string[];
    prompt: string;
    selectedRecipe: { name: string; description: string };
  }): Promise<string> {
    const previousSuggestionsText = input.previousSuggestions.length > 0
      ? "Previous Suggestions: " + input.previousSuggestions.join(", ")
      : "";
    const promptText = input.prompt ? "Prompt: " + input.prompt : "No specific prompt provided.";
    const recipeText = `Selected Recipe - Name: ${input.selectedRecipe.name}, Description: ${input.selectedRecipe.description}`;

    return `Email: ${input.email}${
      previousSuggestionsText ? ", " + previousSuggestionsText : ""
    }, ${promptText}, ${recipeText}`;
  }

  protected async getSystemMessage(input: {
    email: string;
    previousSuggestions: string[];
    prompt: string;
    tokens: string[];
    selectedRecipe: { name: string; description: string };
  }): Promise<string> {
    const previousSuggestionsText = input.previousSuggestions.length > 0
      ? "Considering the previous suggestions provided: " + input.previousSuggestions.join(", ") + "."
      : "";
    const tokenText = input.tokens.length > 0 ? "Using tokens: " + input.tokens.join(", ") + "." : "No tokens provided.";
    const recipeInspirationText = `While the suggested profile nicknames should be catchy and memorable, they should not overemphasize any specific ingredient or dish. Instead, aim for creativity and personal flair, reflecting a diverse range of culinary interests.`;

    const TEMPLATE = `Generate six personalized nicknames suitable for a recipe app profile, based on the user's email address and ${previousSuggestionsText} ${tokenText} ${recipeInspirationText} The nicknames should incorporate elements of the email (ignoring the domain), use random numbers, and you can use underscores for readability. Reflect a variety of styles seen in usernames like [Adjective][Noun] (e.g., BakingJohn), [Flavor/Ingredient][Descriptor] (e.g., VanillaTony), [Region/City][Chef/Cook] (e.g., denver_cook_smith, TokyoChef) or another style. Aim for a mix of camelcase (70% of the time) and full lower case with underscores (30% of the time).

Format the response in YAML with a single key "names" and then the list of text strings to show as suggestion user names. Return nothing else but the formatted YAML. Return 6 suggestions`;
    return TEMPLATE;
  }

  protected getDefaultTokens(): number {
    return 1024;
  }
}
