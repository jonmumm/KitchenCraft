import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { TokenStream } from "@/lib/token-stream";
import { InstantRecipePredictionOutputSchema } from "@/schema";
import { z } from "zod";
import { buildInput } from "./utils";

export type InstantRecipeStreamInput = {
  prompt: string;
  tokens: string[];
};

export const InstantRecipeEventBase = "INSTANT_RECIPE";

export type InstantRecipeEvent = StreamObservableEvent<
  typeof InstantRecipeEventBase,
  z.infer<typeof InstantRecipePredictionOutputSchema>
>;

export class InstantRecipeStream extends TokenStream<InstantRecipeStreamInput> {
  protected async getUserMessage(
    input: InstantRecipeStreamInput
  ): Promise<string> {
    return buildInput(input);
  }

  protected async getSystemMessage(
    input: InstantRecipeStreamInput
  ): Promise<string> {
    return INSTANT_RECIPE_SYSTEM_TEMPLATE(input);
  }

  protected getDefaultTokens(): number {
    return 2048;
  }
}

const INSTANT_RECIPE_SYSTEM_TEMPLATE = (
  input: InstantRecipeStreamInput
): string => `
You are an expert chef assistant. The user will provide input including a set of ingredients, dish names, cooking equipment, preferences, or techniques. Produce a recipe that closely matches the input, formatted in YAML.

Here are examples:

Input: ${EXAMPLE_1.input}
Output: ${EXAMPLE_1.output}

Input: ${EXAMPLE_2.input}
Output: ${EXAMPLE_2.output}

Input: ${EXAMPLE_3.input}
Output: ${EXAMPLE_3.output}

Ensure all recipes are provided back in YAML format, following the keys and order specified below:
${FORMAT_INSTRUCTIONS}
`;

const FORMAT_INSTRUCTIONS = `\`\`\`yaml
recipe:
  name: "Name of the recipe"
  description: "Short description of the recipe"
  yield: "String indicating how many servings or the quantity yielded"
  activeTime: "ISO 8601 duration format (e.g., PT15M for 15 minutes)"
  cookTime: "ISO 8601 duration format (e.g., PT1H for 1 hour)"
  totalTime: "ISO 8601 duration format (e.g., PT1H15M for 1 hour and 15 minutes)"
  tags:
    - "Tag 1"
    - "Tag 2"
    - "... additional tags related to the recipe"
  ingredients:
    - "Ingredient 1 with quantity and description"
    - "Ingredient 2 with quantity and description"
    - "... additional ingredients"
  instructions:
    - "Step 1 of the cooking/preparation instructions"
    - "Step 2 of the cooking/preparation instructions"
    - "... additional steps"
\`\`\`
`;

const EXAMPLE_1 = {
  input: `quinoa salad`,
  output: `\`\`\`yaml
  recipe:
    name: "Quinoa Salad with Avocado and Tomatoes"
    description: "A refreshing and nutritious salad, perfect for a quick lunch or a side dish."
    yield: "4 servings"
    activeTime: "PT15M"
    cookTime: "PT20M"
    totalTime: "PT35M"
    tags:
      - "Salad"
      - "Vegetarian"
      - "Gluten-Free"
    ingredients:
      - "1 cup quinoa"
      - "2 cups water"
      - "1 avocado, diced"
      - "1 cup cherry tomatoes, halved"
      - "1/4 cup chopped cilantro"
      - "2 tablespoons olive oil"
      - "1 lime, juiced"
      - "Salt and pepper to taste"
    instructions:
      - "Rinse the quinoa under cold water until the water runs clear."
      - "Combine quinoa and water in a medium saucepan. Bring to a boil, then cover and reduce to a simmer for 15 minutes or until water is absorbed."
      - "Remove from heat and let sit, covered, for 5 minutes. Fluff with a fork and allow to cool slightly."
      - "In a large bowl, combine cooled quinoa, avocado, tomatoes, and cilantro."
      - "Drizzle with olive oil and lime juice, and season with salt and pepper. Toss gently to combine."
      - "Serve chilled or at room temperature."
  \`\`\``,
};

const EXAMPLE_2 = {
  input: `beef stew`,
  output: `\`\`\`yaml
  recipe:
    name: "Hearty Beef Stew"
    description: "A warm, comforting stew made with tender chunks of beef, potatoes, and carrots."
    yield: "6 servings"
    activeTime: "PT20M"
    cookTime: "PT2H"
    totalTime: "PT2H20M"
    tags:
      - "Stew"
      - "Main Course"
      - "Winter"
    ingredients:
      - "2 pounds beef chuck, cut into 1-inch pieces"
      - "1/4 cup all-purpose flour"
      - "3 tablespoons olive oil"
      - "4 cups beef broth"
      - "1 cup red wine"
      - "3 potatoes, peeled and cubed"
      - "3 carrots, sliced"
      - "1 onion, chopped"
      - "2 cloves garlic, minced"
      - "1 teaspoon dried thyme"
      - "Salt and pepper to taste"
    instructions:
      - "Toss the beef with flour to coat evenly."
      - "Heat olive oil in a large pot. Add beef and sear on all sides until browned. Remove beef and set aside."
      - "In the same pot, add onion and garlic, cooking until softened."
      - "Pour in beef broth and red wine, scraping up any browned bits from the bottom of the pot."
      - "Return beef to the pot. Add potatoes, carrots, and thyme."
      - "Bring to a boil, then reduce heat and simmer covered for 2 hours or until the beef is tender."
      - "Season with salt and pepper before serving."
  \`\`\``,
};

const EXAMPLE_3 = {
  input: `pancakes`,
  output: `\`\`\`yaml
  recipe:
    name: "Fluffy Buttermilk Pancakes"
    description: "Light and fluffy pancakes, perfect for a hearty breakfast."
    yield: "8 pancakes"
    activeTime: "PT10M"
    cookTime: "PT15M"
    totalTime: "PT25M"
    tags:
      - "Breakfast"
      - "Baking"
    ingredients:
      - "2 cups all-purpose flour"
      - "2 teaspoons baking powder"
      - "1 teaspoon baking soda"
      - "1/2 teaspoon salt"
      - "1 tablespoon sugar"
      - "2 cups buttermilk"
      - "1/4 cup melted butter"
      - "2 eggs"
      - "Butter or oil for frying"
    instructions:
      - "In a large bowl, mix together flour, baking powder, baking soda, salt, and sugar."
      - "In another bowl, whisk together buttermilk, melted butter, and eggs."
      - "Pour the wet ingredients into the dry ingredients and stir until just combined. Do not overmix; some lumps are okay."
      - "Heat a skillet over medium heat and lightly grease with butter or oil."
      - "Pour 1/4 cup of batter for each pancake onto the skillet. Cook until bubbles form on the surface, then flip and cook until golden brown on the other side."
      - "Serve hot with maple syrup, fresh berries, or your favorite pancake toppings."
  \`\`\``,
};
