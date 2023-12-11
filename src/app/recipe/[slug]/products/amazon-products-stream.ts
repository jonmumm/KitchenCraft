import { TokenStream } from "@/lib/token-stream";
import { AmazonProductsPredictionInput } from "@/types";
import { PromptTemplate } from "langchain/prompts";

export class AmazonProductsTokenStream extends TokenStream<AmazonProductsPredictionInput> {
  protected async getUserMessage(
    input: AmazonProductsPredictionInput
  ): Promise<string> {
    return await userMessageTemplate.format({
      googleSearchText: input.googleSearchText,
      recipeName: input.recipe.name,
      recipeDescription: input.recipe.description,
      recipeTags: Array.isArray(input.recipe.tags)
        ? input.recipe.tags.join("\n")
        : "",
      recipeIngredients: Array.isArray(input.recipe.ingredients)
        ? input.recipe.ingredients.join("\n")
        : "",
      recipeInstructions: Array.isArray(input.recipe.instructions)
        ? input.recipe.instructions.join("\n")
        : "",
    });
  }

  protected async getSystemMessage(
    input: AmazonProductsPredictionInput
  ): Promise<string> {
    return TEMPLATE;
  }
}

const userMessageTemplate = PromptTemplate.fromTemplate(`
\`\`\`yaml
recipe:
  name: {recipeName}
  description: {recipeDescription}
  tags: {recipeTags}
  ingredients: {recipeIngredients}
  instructions: {recipeInstructions}
\`\`\`

\`\`\`json
{googleSearchText}
\`\`\`
`);

const TEMPLATE = `The user will provide with a recipe and a list of Amazon.com search results for products they sell.

Parse the search results and select back the 5 best products that might be appealing to a home cook who is making the provided recipe, 

Offer a varied mix of different products (i.e. do not suggest 5 blenders or 5 different salt shakers).

Each product should be one of type: book, ingredient, or equipment.

Clean up each product name and description, removing mentions of Amazon or other text not-related to the product itself.

Format the response in a valid yaml block with "products" as the root level key for the list. Each product should have a name, description, type (possible values are: 'ingredient', 'equipment', or 'book'), and a ASIN (Amazon Standard Identification Number). 

Strings (like name, description) with characters that might break YAML parsing should be in quotes.

Here is an example output:

If the product is not a book, ignredient or piece of equipment, do not return it.

\`\`\`yaml
products:
  - name: "Caraway Nonstick Ceramic Cookware Set"
    description: "This set includes a non-toxic, non-stick coating for simple cooking, and comes in 12 color options. It includes a frying pan, saucepan, saute pan, and a Dutch oven with convenient storage."
    type: "equipment"
    asin: "ABC123XYZ"
  - name: "The Korean Vegan Cookbook: Reflections and Recipes from Omma's Kitchen"
    description: "This cookbook offers a transformative approach to classic Korean dishes using vegan techniques."
    type: "book"
    asin: "DEF456UVW"
  - name: "Instant Pot Pro 10-in-1 Pressure Cooker"
    description: "A multi-cooker that cooks meals up to 70% faster than traditional methods, featuring ultra-quiet steam release, step-by-step cooking instructions, and a real-time progress bar."
    type: "equipment"
    asin: "GHI789STU"
  - name: "KitchenAid Artisan Stand Mixer, 5-Qt."
    description: "A versatile stand mixer with 10 speeds, suitable for nearly any task or recipe."
    type: "equipment"
    asin: "JKL012VWX"
  - name: "Caraway 11-Piece Bakeware Set"
    description: "A comprehensive set for baking needs, including various pans and trays for different baking requirements."
    type: "equipment"
    asin: "MNO345YZ"
\`\`\``;
