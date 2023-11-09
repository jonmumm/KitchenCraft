import { TokenStream } from "@/lib/token-stream";
import {
  NewRecipePredictionInput,
  RecipePredictionInput,
  ScaleRecipePredictionInput,
  SubstituteRecipePredictionInput,
} from "@/types";
import { FORMAT_INSTRUCTIONS } from "./format-instructions";
import { EXAMPLE_1, EXAMPLE_2, EXAMPLE_3 } from "./prediction-examples";

export class RecipeTokenStream extends TokenStream<RecipePredictionInput> {
  protected async getUserMessage(
    input: RecipePredictionInput
  ): Promise<string> {
    switch (input.type) {
      case "NEW_RECIPE":
        return NEW_RECIPE_USER_PROMPT(input);
      case "SCALE_RECIPE":
        return SCALE_RECIPE_USER_PROMPT(input);
      case "SUBSTITUTE_RECIPE":
        return SUBSTITUTE_RECIPE_USER_PROMPT(input);
    }
  }

  protected async getSystemMessage(
    input: RecipePredictionInput
  ): Promise<string> {
    switch (input.type) {
      case "NEW_RECIPE":
        return NEW_RECIPE_TEMPLATE(input);
      case "SCALE_RECIPE":
        return SCALE_RECIPE_TEMPLATE(input);
      case "SUBSTITUTE_RECIPE":
        return SUBSTITUTE_RECIPE_TEMPLATE(input);
    }
  }

  protected getDefaultTokens(): number {
    return 2048;
  }
}

const SCALE_RECIPE_USER_PROMPT = (input: ScaleRecipePredictionInput) =>
  `${input.scale}`;

const SUBSTITUTE_RECIPE_USER_PROMPT = (
  input: SubstituteRecipePredictionInput
) => `${input.substitution}`;

const NEW_RECIPE_USER_PROMPT = (input: NewRecipePredictionInput) => `
\`\`\`yaml
name: ${input.recipe.name}
description: ${input.recipe.description}
\`\`\`
`;

const SUBSTITUTE_RECIPE_TEMPLATE = (
  input: SubstituteRecipePredictionInput
) => `The user will provide a instructions for a substitution they would like to make in the below recipe.

Please give back the yaml for the updated recipe, applying the substitution instructions as specified by the user.

\`\`\`yaml
recipe:
  name: ${input.recipe.name}
  description: ${input.recipe.description}
  yield: ${input.recipe.yield}
  activeTime: ${input.recipe.activeTime}
  cookTime: ${input.recipe.cookTime}
  totalTime: ${input.recipe.totalTime}
  tags:
${input.recipe.tags.map((item) => `    - "${item}"`).join("\n")}
  ingredients:
${input.recipe.ingredients.map((item) => `    - "${item}"`).join("\n")}
  instructions:
${input.recipe.instructions.map((item) => `\ \ \ \ - "${item}"`).join("\n")}
\`\`\`

${FORMAT_INSTRUCTIONS}`;

const SCALE_RECIPE_TEMPLATE = (
  input: ScaleRecipePredictionInput
) => `The user will provide a instructions for how they would like to scale the serving size for the below recipe.

Please give back the yaml for the updated recipe, applying the scale instructions as specified by the user.

\`\`\`yaml
recipe:
  name: ${input.recipe.name}
  description: ${input.recipe.description}
  yield: ${input.recipe.yield}
  activeTime: ${input.recipe.activeTime}
  cookTime: ${input.recipe.cookTime}
  totalTime: ${input.recipe.totalTime}
  tags:
${input.recipe.tags.map((item) => `    - "${item}"`).join("\n")}
  ingredients:
${input.recipe.ingredients.map((item) => `    - "${item}"`).join("\n")}
  instructions:
${input.recipe.instructions.map((item) => `    - "${item}"`).join("\n")}
\`\`\`

${FORMAT_INSTRUCTIONS}`;

const NEW_RECIPE_TEMPLATE = (
  input: NewRecipePredictionInput
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
