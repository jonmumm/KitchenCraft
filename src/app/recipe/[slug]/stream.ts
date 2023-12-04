import { TokenStream } from "@/lib/token-stream";
import {
  NewInstantRecipePredictionInput,
  NewRecipeFromSuggestionsPredictionInput,
  RecipePredictionInput,
} from "@/types";
import { FORMAT_INSTRUCTIONS } from "./format-instructions";
import { EXAMPLE_1, EXAMPLE_2, EXAMPLE_3 } from "./prediction-examples";

export class RecipeTokenStream extends TokenStream<RecipePredictionInput> {
  protected async getUserMessage(
    input: RecipePredictionInput
  ): Promise<string> {
    switch (input.type) {
      case "NEW_RECIPE_FROM_SUGGESTIONS":
        return NEW_RECIPE_FROM_SUGGESTIONS_USER_PROMPT(input);
      case "NEW_INSTANT_RECIPE":
        return NEW_INSTANT_RECIPE_USER_PROMPT(input);
    }
  }

  protected async getSystemMessage(
    input: RecipePredictionInput
  ): Promise<string> {
    switch (input.type) {
      case "NEW_INSTANT_RECIPE":
        return NEW_INSTANT_RECIPE_TEMPLATE(input);
      case "NEW_RECIPE_FROM_SUGGESTIONS":
        return NEW_RECIPE_FROM_SUGGESTIONS_TEMPLATE(input);
    }
  }

  protected getDefaultTokens(): number {
    return 2048;
  }
}

const NEW_INSTANT_RECIPE_USER_PROMPT = (
  input: NewInstantRecipePredictionInput
) => input.prompt;

const NEW_RECIPE_FROM_SUGGESTIONS_USER_PROMPT = (
  input: NewRecipeFromSuggestionsPredictionInput
) => `
\`\`\`yaml
name: ${input.recipe.name}
description: ${input.recipe.description}
\`\`\`
`;

const NEW_INSTANT_RECIPE_TEMPLATE = (_: NewInstantRecipePredictionInput) => `
The user will provide for a prompt to generate a recipe. Please generate a full recipe for this selection following the format and examples below.

Format: ${FORMAT_INSTRUCTIONS}

Here are example outputs:

Example 1: ${EXAMPLE_1.output}

Example 2: ${EXAMPLE_2.output}

Example 3: ${EXAMPLE_3.output}`;

const NEW_RECIPE_FROM_SUGGESTIONS_TEMPLATE = (
  input: NewRecipeFromSuggestionsPredictionInput
) => `The original prompt to come up with recipes ideas was: ${JSON.stringify(
  input.suggestionsInput.prompt,
  null,
  2
)}
The user will provide the name and description for a recipe based on the original prompt. Please generate a full recipe for this selection following the format and examples below.

Format: ${FORMAT_INSTRUCTIONS}

Here are example outputs:

Example 1: ${EXAMPLE_1.output}

Example 2: ${EXAMPLE_2.output}

Example 3: ${EXAMPLE_3.output}`;
