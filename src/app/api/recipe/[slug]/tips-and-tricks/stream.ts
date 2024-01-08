import { TokenStream } from "@/lib/token-stream";
import { TipsAndTricksPredictionInput } from "@/types";
import { PromptTemplate } from "langchain/prompts";

export class TipsAndTricksTokenStream extends TokenStream<TipsAndTricksPredictionInput> {
  protected async getUserMessage(
    input: TipsAndTricksPredictionInput
  ): Promise<string> {
    return userMessageTemplate.format({
      name: input.recipe.name,
      description: input.recipe.description,
      yield: input.recipe.yield,
      tags: Array.isArray(input.recipe.tags)
        ? input.recipe.tags.join("\n")
        : "",
      ingredients: Array.isArray(input.recipe.ingredients)
        ? input.recipe.ingredients.join("\n")
        : "",
      instructions: Array.isArray(input.recipe.instructions)
        ? input.recipe.instructions.join("\n")
        : "",
    });
  }

  protected async getSystemMessage(
    input: TipsAndTricksPredictionInput
  ): Promise<string> {
    return TEMPLATE;
  }

  protected getDefaultTokens(): number {
    return 2048;
  }
}

const userMessageTemplate = PromptTemplate.fromTemplate(`
\`\`\`yaml
recipe:
  name: {name}
  description: {description}
  yield: {yield}
  tags: {tags}
  ingredients: {ingredients}
  instructions: {instructions}
\`\`\`
`);

const TEMPLATE = `You are a creative, helpful and practical home kitchen assistant.

The user will provide a recipe. Offer the best tips and tricks as it relates to that recipe.

Format the response in markdown`;
