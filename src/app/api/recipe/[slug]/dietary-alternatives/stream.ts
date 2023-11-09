import { TokenStream } from "@/lib/token-stream";
import { DietaryAlternativesPredictionInput } from "@/types";
import { PromptTemplate } from "langchain/prompts";

export class DietaryAlternativesTokenStream extends TokenStream<DietaryAlternativesPredictionInput> {
  protected async constructPrompt(
    input: DietaryAlternativesPredictionInput
  ): Promise<string> {
    // Construct the prompt based on the input
    const userMessage = await userMessageTemplate.format({
      name: input.recipe.name,
      description: input.recipe.description,
      tags: input.recipe.tags.join("\n"),
      ingredients: input.recipe.ingredients.join("\n"),
      instructions: input.recipe.instructions.join("\n"),
    });
    return `${TEMPLATE.replace("{prompt}", userMessage)}`;
  }

  protected async constructTemplate(
    input: DietaryAlternativesPredictionInput
  ): Promise<string> {
    // Construct and return the template, if needed
    return TEMPLATE; // Assuming TEMPLATE is a constant defined somewhere in your code.
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

const TEMPLATE = `You will be provided with a recipe. Come up with 6 ideas for ways to alternate this recipe for common dietary or nutritional reasons.

Each idea should be 3-7 words. Format the response in a yaml block with "ideas" as the root level key for the list.

Here is an example response for an No-Bake Banan Cream Pie.

\`\`\`yaml
ideas:
  - Use gluten-free graham crackers.
  - Substitute butter with coconut oil.
  - Employ a sugar substitute like stevia.
  - Swap bananas for low-carb berries.
  - Replace heavy cream with coconut cream.
  - Opt for vegan cream cheese alternative.
\`\`\`

User: {prompt}
AI:`;
