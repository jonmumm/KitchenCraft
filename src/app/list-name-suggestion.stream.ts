import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { TokenStream } from "@/lib/token-stream";
import { z } from "zod";

type Input = {
  prompt: string;
  recipeNames: string[];
};

export const ListNameSuggestionOutputSchema = z.string();

export const ListNameSuggestionEventBase = "LIST_NAME";

export type ListNameSuggestionEvent = StreamObservableEvent<
  typeof ListNameSuggestionEventBase,
  z.infer<typeof ListNameSuggestionOutputSchema>
>;

export class ListNameSuggestionStream extends TokenStream<{
  prompt: string;
}> {
  protected async getUserMessage(input: Input): Promise<string> {
    return `Prompt: ${input.prompt}. ${
      input.recipeNames.length > 1
        ? `Recipe Name: ${input.recipeNames[0]}`
        : `Recipe Names: ${input.recipeNames.join(", ")}`
    }`;
  }

  protected async getSystemMessage(input: Input): Promise<string> {
    const TEMPLATE = `The user will provide a prompt they used to generate recipes, and the ${
      input.recipeNames.length > 1
        ? "names of recipes they have curated that were created from that prompt."
        : "name of a recipe they created"
    }.

    Suggest a name for a list that gets created automatically for this user to be able to save/share recipes related to the recipe and the prompt.

    Include nothing else in the response but the name.
    `;

    return TEMPLATE;
  }

  protected getDefaultTokens(): number {
    return 64;
  }
}
