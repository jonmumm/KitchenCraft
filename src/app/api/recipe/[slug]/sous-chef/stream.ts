import { TokenStream } from "@/lib/token-stream";
import { SousChefPredictionInput } from "@/types";
import { PromptTemplate } from "langchain/prompts";

export class SousChefTokenStream extends TokenStream<SousChefPredictionInput> {
  protected async getUserMessage(
    input: SousChefPredictionInput
  ): Promise<string> {
    return input.prompt;
  }

  protected async getSystemMessage(
    input: SousChefPredictionInput
  ): Promise<string> {
    return await systemMessageTemplate.format({
      name: input.recipe.name,
      description: input.recipe.description,
      tags: input.recipe.tags.join("\n"),
      ingredients: input.recipe.ingredients.join("\n"),
      instructions: input.recipe.instructions.join("\n"),
    });
  }

  protected getDefaultTokens(): number {
    return 2048;
  }
}

const systemMessageTemplate = PromptTemplate.fromTemplate(`
You are a helpful kitchen assistant. Below is a recipe. The user will ask a question about it. Please give a helpful response.

\`\`\`yaml
recipe:
  name: {name}
  description: {description}
  tags: {tags}
  ingredients: {ingredients}
  instructions: {instructions}
\`\`\`

Format the response in markdown.`);
