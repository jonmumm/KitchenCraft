import { TokenStream } from "@/lib/token-stream";
import { FAQsPredictionInput, RemixIdeasPredictionInput } from "@/types";
import { Ollama } from "langchain/llms/ollama";
import { PromptTemplate } from "langchain/prompts";

export class FAQsTokenStream extends TokenStream<FAQsPredictionInput> {
  protected async getUserMessage(input: FAQsPredictionInput): Promise<string> {
    return userMessageTemplate.format({
      name: input.recipe.name,
      description: input.recipe.description,
      tags: input.recipe.tags.join("\n"),
      ingredients: input.recipe.ingredients.join("\n"),
      instructions: input.recipe.instructions.join("\n"),
    });
  }

  protected async getSystemMessage(
    input: FAQsPredictionInput
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
  tags: {tags}
  ingredients: {ingredients}
  instructions: {instructions}
\`\`\`
`);

const TEMPLATE = `You are an expert chef assistant. You will be provided with a recipe.

Assume I have no kitchen experience. Come up with a list of 6 of the most common questions I might have about the provided recipe.

Format the response in a yaml block with "questions" as the root level key for the list.

Here is an example response for a Tomato Soup Recipe:

\`\`\`yaml
questions:
  - How do I properly chop the vegetables?
  - What if I don’t have an immersion blender?
  - How do I prevent the milk or cream from curdling when I add it to the soup?
  - What’s the best way to break up the whole tomatoes?
  - How do I know if I need to add sugar, and how much should I add?
  - What if I over-salt the soup?
\`\`\``;
