import { TokenStream } from "@/lib/token-stream";
import {
  NewRecipeFromSuggestionsPredictionInput,
  RecipePredictionInput,
} from "@/types";
import { FORMAT_INSTRUCTIONS } from "./format-instructions";
import { EXAMPLE_1, EXAMPLE_2, EXAMPLE_3 } from "./prediction-examples";

export class RecipeTokenStream extends TokenStream<RecipePredictionInput> {
  protected async getUserMessage(
    input: RecipePredictionInput
  ): Promise<string> {
    return NEW_RECIPE_USER_PROMPT_TEMPLATE(input);
  }

  protected async getSystemMessage(
    input: RecipePredictionInput
  ): Promise<string> {
    return NEW_RECIPE_TEMPLATE(input);
  }

  protected getDefaultTokens(): number {
    return 2048;
  }
}

const NEW_RECIPE_USER_PROMPT_TEMPLATE = (input: RecipePredictionInput) => `
${input.prompt}

\`\`\`yaml
name: ${input.recipe.name}
description: ${input.recipe.description}
\`\`\`
`;

const NEW_RECIPE_TEMPLATE = (input: RecipePredictionInput) => `
The user will provide for a name and description of a recipe to generate. Please generate a full recipe for this selection following the format and examples below.

Format: ${FORMAT_INSTRUCTIONS}

Here are example outputs:

Example 1: ${EXAMPLE_1.output}

Example 2: ${EXAMPLE_2.output}

Example 3: ${EXAMPLE_3.output}

For added context, this is the original prompt to come up with the name and description the user will provide:

\`\`\`
${input.prompt}
\`\`\`
`;

const NEW_RECIPE_FROM_SUGGESTIONS_TEMPLATE = (
  input: NewRecipeFromSuggestionsPredictionInput
) => `
The user will provide the name and description for a recipe based on the original prompt. Please generate a full recipe for this selection following the format and examples below.

Format: ${FORMAT_INSTRUCTIONS}

Here are example outputs:

Example 1: ${EXAMPLE_1.output}

Example 2: ${EXAMPLE_2.output}

Example 3: ${EXAMPLE_3.output}

For added context, this is the original prompt to come up with recipes ideas was: ${JSON.stringify(
  input.suggestionsInput.prompt,
  null,
  2
)}
`;
