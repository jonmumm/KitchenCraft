import { TokenStream } from "@/lib/token-stream";
import { RecipeProductsPredictionInput } from "@/types";
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
    let template = "";
    let formattingInstructions = "";

    if (input.type === "book") {
      return bookTemplate;
    } else if (input.type === "equipment") {
      return equipmentTemplate;
    } else if (input.type === "ingredient") {
      return ingredientTemplate;
    }

    return `${template}\n\n${formattingInstructions}`;
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

const bookTemplate = `Given the user's recipe, give me back a list of 20 keywords for books topics that might be interesting to someone intersted in that recipe.

Format the list in a yaml block with "queries" as the root level key for the list.

Here is an example response for a tomato soup recipe:

\`\`\`yaml
queries:
  - "Gourmet soup recipes"
  - "Soup and salad combos"
  - "Homemade comfort food"
  - "Tomato-based dishes"
  - "Italian cuisine"
  - "Soup for the soul"
  - "Vegetarian soups"
  - "Cooking with herbs and spices"
  - "Soup and sandwich pairings"
  - "Farm-to-table cooking"
  - "Hearty winter soups"
  - "Healthy soup options"
  - "Creamy tomato bisque"
  - "International soups"
  - "Soups from around the world"
  - "Soup for beginners"
  - "Cooking with fresh ingredients"
  - "Savoring soups and stews"
  - "Soup and bread recipes"
  - "Soup for all seasons"
\`\`\``;

export const equipmentFormatInstructions = `
Format the response in a yaml block with "queries" as the root level key for the list.

Here is an example response for a Tomato Soup Recipe:

\`\`\`yaml
queries:
  - "Soup Pot"
  - "Ladle"
  - "Immersion Blender"
  - "Cutting Board"
  - "Chef's Knife"
  - "Vegetable Peeler"
  - "Strainer"
  - "Soup Bowls"
  - "Soup Spoons"
  - "Soup Ladle Rest"
  - "Timer"
  - "Mixing Bowls"
  - "Can Opener"
  - "Herb and Spice Rack"
  - "Stockpot"
  - "Measuring Cups and Spoons"
  - "Colander"
  - "Potato Masher"
  - "Thermometer"
  - "Trivet"
\`\`\``;

// template = `Please provide ideas for search queries that could be used to search for kitchen equipment, gear, and tools for someone interested in this recipe.`;
// formattingInstructions = equipmentFormatInstructions;
const equipmentTemplate = `Given the user's recipe, help me a list of 20 kitchen equipment, tools, gadgets, and gear a home cook could ever want to buy as it relates to it.

Format the response in a yaml block with "queries" as the root level key for the list.

Here is an example response for a tomato soup recipe:

\`\`\`yaml
queries:
  - "Soup Pot"
  - "Ladle"
  - "Immersion Blender"
  - "Cutting Board"
  - "Chef's Knife"
  - "Vegetable Peeler"
  - "Strainer"
  - "Soup Bowls"
  - "Soup Spoons"
  - "Soup Ladle Rest"
  - "Timer"
  - "Mixing Bowls"
  - "Can Opener"
  - "Herb and Spice Rack"
  - "Stockpot"
  - "Measuring Cups and Spoons"
  - "Colander"
  - "Potato Masher"
  - "Thermometer"
  - "Trivet"
  - "Garlic Press"
  - "Pepper Grinder"
  - "Saucepan"
  - "Casserole Dish"
  - "Sauté Pan"
  - "Oven Mitts"
  - "Chopping Knife"
  - "Garlic Crusher"
  - "Wooden Spoon"
  - "Tongs"
  - "Salt and Pepper Shakers"
  - "Olive Oil Dispenser"
\`\`\`

Avoid choosing examples from this list and instead orient them around the recipe provided by the user.

Do not include any ingredients or consumable items in the returned list. Focus just on kitchen products.
`;

const ingredientTemplate = `Given the user's recipe, help me a list of 32 ingredients a home cook could want to buy as it relates to it, sorted by most relevant.

Format the response in a yaml block with "queries" as the root level key for the list.

Here is an example response for a tortilla recipe:

\`\`\`yaml
queries:
  - Masa Harina
  - Water
  - Salt
  - Mozzarella Cheese
  - Cheddar Cheese
  - Cooking Oil
  - Salsa
  - Sour Cream
  - Guacamole
  - Sliced Jalapeños
  - Cilantro
  - Lime Wedges
  - Ground Beef
  - Chicken Breast
  - Black Beans
  - Corn
  - Onions
  - Garlic
  - Cumin
  - Paprika
  - Red Pepper Flakes
  - Avocado
  - Tomatoes
  - Red Bell Pepper
  - Green Bell Pepper
  - Chipotle Peppers in Adobo Sauce
  - Shredded Lettuce
  - Red Onion
  - Jalapeño Pepper
  - Sliced Olives
  - Lime Juice
\`\`\``;
