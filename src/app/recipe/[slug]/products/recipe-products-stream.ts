import { TokenStream } from "@/lib/token-stream";
import {
  EquipmentAdaptationsPredictionInput,
  RecipeProductsPredictionInput,
} from "@/types";
import { PromptTemplate } from "langchain/prompts";

export class RecipeProductsTokenStream extends TokenStream<RecipeProductsPredictionInput> {
  protected async getUserMessage(
    input: RecipeProductsPredictionInput
  ): Promise<string> {
    return await userMessageTemplate.format({
      name: input.recipe.name,
      description: input.recipe.description,
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
    input: RecipeProductsPredictionInput
  ): Promise<string> {
    return TEMPLATE;
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

const TEMPLATE = `You will be provided with a recipe. Come up with a list of 10 products that could be relevant to a home cook for this recipe that someone may want to purchase sorted by the most obvius.

Format the response in a yaml block with "products" as the root level key for the list. Each product should have a name and description. Do not include the words (optional) after a product. Here is an example output for a hamburger bun recipe:

\`\`\`yaml
products:
  - name: Stand Mixer with Dough Hook Attachment
    description: Essential for kneading the dough efficiently.
  - name: Active Dry Yeast
    description: A key ingredient for the dough to rise.
  - name: All-Purpose Flour
    description: The primary ingredient for the buns.
  - name: Kitchen Scale
    description: To accurately measure ingredients like flour and sugar.
  - name: Measuring Cups and Spoons
    description: For precise measurements of liquid and small ingredients.
  - name: Large Mixing Bowl
    description: Needed for mixing and letting the dough rise.
  - name: Silicone Baking Mat or Parchment Paper
    description: To prevent sticking on the baking sheet.
  - name: Baking Sheet
    description: For baking the buns in the oven.
  - name: Wire Rack
    description: For cooling the buns after baking.
  - name: Pastry Brush
    description: To brush the buns with milk before baking.
  - name: Oven Thermometer
    description: To ensure the correct baking temperature.
  - name: Kitchen Towel
    description: For covering the dough while it rises.
  - name: Granulated Sugar
    description: Another key ingredient for the buns.
  - name: Unsalted Butter
    description: Used in the dough mixture.
  - name: Milk
    description: For brushing on the buns before baking.
  - name: Digital Timer
    description: To keep track of baking and resting times.
  - name: Oven Mitts
    description: For safety when handling the hot baking sheet.
  - name: Dough Scraper
    description: To easily handle and divide the dough.
  - name: Egg
    description: Required for the dough recipe.
  - name: Salt
    description: A necessary seasoning for the dough.
\`\`\``;
