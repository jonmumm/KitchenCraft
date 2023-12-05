import { TokenStream } from "@/lib/token-stream";
import {
  ModifyRecipeDietaryPredictionInput,
  ModifyRecipeEquipmentPredictionInput,
  ModifyRecipeFreeTextPredictionInput,
  ModifyRecipeIngredientsPredictionInput,
  ModifyRecipeScalePredictionInput,
  RemixPredictionInput,
} from "@/types";
import { FORMAT_INSTRUCTIONS } from "./constants";

export class RemixTokenStream extends TokenStream<RemixPredictionInput> {
  protected async getUserMessage(input: RemixPredictionInput): Promise<string> {
    switch (input.type) {
      case "MODIFY_RECIPE_DIETARY":
        return DIETARY_RECIPE_USER_PROMPT(input);
      case "MODIFY_RECIPE_EQUIPMENT":
        return EQUIPMENT_RECIPE_USER_PROMPT(input);
      case "MODIFY_RECIPE_INGREDIENTS":
        return SUBSTITUTE_RECIPE_USER_PROMPT(input);
      case "MODIFY_RECIPE_SCALE":
        return SCALE_RECIPE_USER_PROMPT(input);
      case "MODIFY_RECIPE_FREE_TEXT":
        return FREE_TEXT_RECIPE_USER_PROMPT(input);
    }
  }

  protected async getSystemMessage(
    input: RemixPredictionInput
  ): Promise<string> {
    switch (input.type) {
      case "MODIFY_RECIPE_DIETARY":
        return DIETARY_RECIPE_TEMPLATE(input);
      case "MODIFY_RECIPE_EQUIPMENT":
        return EQUIPMENT_RECIPE_TEMPLATE(input);
      case "MODIFY_RECIPE_INGREDIENTS":
        return SUBSTITUTE_RECIPE_TEMPLATE(input);
      case "MODIFY_RECIPE_SCALE":
        return SCALE_RECIPE_TEMPLATE(input);
      case "MODIFY_RECIPE_FREE_TEXT":
        return FREE_TEXT_RECIPE_TEMPLATE(input);
    }
  }

  protected getDefaultTokens(): number {
    return 2048;
  }
}

const FREE_TEXT_RECIPE_USER_PROMPT = (
  input: ModifyRecipeFreeTextPredictionInput
) => `${input.prompt}`;

const SCALE_RECIPE_USER_PROMPT = (input: ModifyRecipeScalePredictionInput) =>
  `${input.prompt}`;

const DIETARY_RECIPE_USER_PROMPT = (
  input: ModifyRecipeDietaryPredictionInput
) => `${input.prompt}`;

const EQUIPMENT_RECIPE_USER_PROMPT = (
  input: ModifyRecipeEquipmentPredictionInput
) => `${input.prompt}`;

const SUBSTITUTE_RECIPE_USER_PROMPT = (
  input: ModifyRecipeIngredientsPredictionInput
) => `${input.prompt}`;

const SUBSTITUTE_RECIPE_TEMPLATE = (
  input: ModifyRecipeIngredientsPredictionInput
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

const FREE_TEXT_RECIPE_TEMPLATE = (
  input: ModifyRecipeFreeTextPredictionInput
) => `The user will provide a instructions for how they would like to modify the recipe below.

Please give back the yaml for the updated recipe, applying the modifications instructions as specified by the user.

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

const SCALE_RECIPE_TEMPLATE = (
  input: ModifyRecipeScalePredictionInput
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

const DIETARY_RECIPE_TEMPLATE = (
  input: ModifyRecipeDietaryPredictionInput
) => `The user will provide a instructions for a change they'd like to make to the recipe for dietary reasons.

Please give back the yaml for the updated recipe, applying the dietary instructions as specified by the user.

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
\`\`\``;

const EQUIPMENT_RECIPE_TEMPLATE = (
  input: ModifyRecipeEquipmentPredictionInput
) => `The user will provide a instructions for a change they'd like to make to the equipment used in this recipe.

Please give back the yaml for the updated recipe, applying any changes as specified by the user.

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
\`\`\``;
