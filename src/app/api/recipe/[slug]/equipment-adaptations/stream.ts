import { TokenStream } from "@/lib/token-stream";
import {
  DietaryAlternativesPredictionInput,
  EquipmentAdaptationsPredictionInput,
} from "@/types";
import { PromptTemplate } from "langchain/prompts";

export class EquipmentAdaptationsTokenStream extends TokenStream<EquipmentAdaptationsPredictionInput> {
  protected async constructPrompt(
    input: EquipmentAdaptationsPredictionInput
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
    input: EquipmentAdaptationsPredictionInput
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

const TEMPLATE = `You will be provided with a recipe. Come up with 4 ideas for ways to alternate this recipe for different common kitchen equipment.

If this recipe can be made using different tools, suggest using those tools.

Each idea should be 3-7 words. Format the response in a yaml block with "ideas" as the root level key for the list.

\`\`\`yaml
ideas:
  - No blender available
  - Adapt for instant pot
  - Adapt for slow cooker
  - Less chopped ingredients
\`\`\`

User: {prompt}
AI:`;
