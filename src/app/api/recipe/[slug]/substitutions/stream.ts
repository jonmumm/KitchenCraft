import { TokenStream } from "@/lib/token-stream";
import { SubstitutionsPredictionInput } from "@/types";
import { PromptTemplate } from "langchain/prompts";

export class SubstitutionsTokenStream extends TokenStream<SubstitutionsPredictionInput> {
  protected async constructPrompt(
    input: SubstitutionsPredictionInput
  ): Promise<string> {
    return await userMessageTemplate.format({
      name: input.recipe.name,
      description: input.recipe.description,
      tags: input.recipe.tags.join("\n"),
      ingredients: input.recipe.ingredients.join("\n"),
      instructions: input.recipe.instructions.join("\n"),
    });
  }

  protected async constructTemplate(
    input: SubstitutionsPredictionInput
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

const TEMPLATE = `You will be provided with a recipe. Come up with 6 ideas for ways to change this recipe that might be be practical, easy, or delicious.

Each substitutions should be 3-7 words. Format the response in a yaml block with "substitutions" as the root level key for the list.

Here is an example response for an Avocado Gazpacho soup.

\`\`\`yaml
subsitutions:
  - Swap tomatoes for roasted red peppers.
  - Use lime juice instead of vinegar.
  - Replace honey with agave syrup.
  - Try Greek yogurt for creaminess.
  - Substitute green bell pepper for jalapeños.
  - Exchange cucumber for zucchini.
\`\`\`

User: {prompt}
AI:`;
