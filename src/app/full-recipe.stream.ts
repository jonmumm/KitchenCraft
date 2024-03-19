import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { TokenStream } from "@/lib/token-stream";
import { RecipePredictionOutputSchema } from "@/schema";
import { z } from "zod";
import { buildInput } from "./utils";

export type FullRecipeStreamInput = {
  prompt: string;
  tokens: string[];
  name: string;
  description: string;
};

export const FullRecipeEventBase = "FULL_RECIPE";

export type FullRecipeEvent = StreamObservableEvent<
  typeof FullRecipeEventBase,
  z.infer<typeof RecipePredictionOutputSchema>
>;

export class FullRecipeStream extends TokenStream<FullRecipeStreamInput> {
  protected async getUserMessage(input: FullRecipeStreamInput): Promise<string> {
    return NEW_RECIPE_USER_PROMPT_TEMPLATE(input);
  }

  protected async getSystemMessage(input: FullRecipeStreamInput): Promise<string> {
    return NEW_RECIPE_TEMPLATE(input);
  }

  protected getDefaultTokens(): number {
    return 2048;
  }
}

const NEW_RECIPE_USER_PROMPT_TEMPLATE = (input: FullRecipeStreamInput) => `
${buildInput(input)}

\`\`\`yaml
name: ${input.name}
description: ${input.description}
\`\`\`
`;

const NEW_RECIPE_TEMPLATE = (
  input: FullRecipeStreamInput
) => `You are an expert chef assistant. The user will provider the name and description for a recipe.

Come up with a recipe recipe that matches the users prompt following the format and examples below. Format it in YAML and include nothing else in the response.

Format: ${FORMAT_INSTRUCTIONS}

Here are example outputs:

Example 1: ${EXAMPLE_1.output}

Example 2: ${EXAMPLE_2.output}

Example 3: ${EXAMPLE_3.output}`;

const OUTPUT_1 = `\`\`\`yaml
recipe:
  yield: "12 pieces"
  activeTime: "PT20M"
  cookTime: "PT25M"
  totalTime: "PT45M"
  tags:
    - "Dessert"
    - "Chocolate"
    - "Baking"
  ingredients:
    - "200g dark chocolate, roughly chopped"
    - "175g unsalted butter"
    - "3 large eggs"
    - "200g granulated sugar"
    - "1 tsp vanilla extract"
    - "100g all-purpose flour"
    - "25g cocoa powder"
    - "1/2 tsp salt"
  instructions:
    - "Preheat oven to 180°C (350°F). Grease and line a square baking tin."
    - "Melt the chocolate and butter together in a heatproof bowl over simmering water."
    - "In another bowl, whisk together the eggs, sugar, and vanilla extract."
    - "Fold the melted chocolate mixture into the egg mixture."
    - "Sift in the flour, cocoa powder, and salt. Fold until just combined."
    - "Pour the batter into the prepared tin and spread evenly."
    - "Bake for 20-25 minutes or until a toothpick comes out with a few crumbs. Let it cool before slicing."
\`\`\``;

const OUTPUT_2 = `\`\`\`yaml
recipe:
  yield: "4 servings"
  activeTime: "PT20M"
  cookTime: "PT40M"
  totalTime: "PT1H"
  tags:
    - "Main Course"
    - "Indian"
    - "Spicy"
  ingredients:
    - "500g boneless chicken, cubed"
    - "150g plain yogurt"
    - "2 tbsp lemon juice"
    - "2 tbsp vegetable oil"
    - "1 large onion, finely chopped"
    - "3 garlic cloves, minced"
    - "1 tbsp ginger paste"
    - "2 tsp garam masala"
    - "1 tsp turmeric powder"
    - "1 tsp red chili powder"
    - "200g canned tomatoes, pureed"
    - "100ml heavy cream"
    - "Salt to taste"
    - "Fresh coriander leaves for garnish"
  instructions:
    - "In a bowl, marinate the chicken with yogurt, lemon juice, and half of the garam masala. Let it sit for at least 2 hours."
    - "Heat oil in a pan and fry the chicken pieces until golden brown. Remove and set aside."
    - "In the same pan, sauté onions until translucent. Add ginger and garlic, and fry for a couple of minutes."
    - "Add the spices (turmeric, red chili powder, remaining garam masala) and sauté for a minute."
    - "Pour in the tomato puree, salt, and let it simmer for 10 minutes."
    - "Add the fried chicken pieces and cream. Cook for another 10-15 minutes until the chicken is tender."
    - "Garnish with fresh coriander leaves before serving."
\`\`\``;

const OUTPUT_3 = `\`\`\`yaml
recipe:
  yield: "6 arepas"
  activeTime: "PT10M"
  cookTime: "PT20M"
  totalTime: "PT30M"
  tags:
    - "Breakfast"
    - "Colombian"
    - "Vegetarian"
  ingredients:
    - "2 cups pre-cooked white cornmeal (masarepa)"
    - "2 cups warm water"
    - "1 tsp salt"
    - "100g mozzarella cheese (optional)"
    - "Butter or oil for frying"
  instructions:
    - "In a large bowl, combine cornmeal, salt, and warm water. Mix until a dough forms."
    - "Divide the dough into 6 equal parts and shape each part into a ball. Flatten the balls to form discs about 1/2 inch thick."
    - "If you're adding cheese, place a portion of the cheese in the center of each disc, fold the dough over, and reshape into a disc, ensuring the cheese is sealed inside."
    - "Heat butter or oil in a skillet over medium heat. Cook the arepas for 7-10 minutes on each side or until they're golden brown."
    - "Serve hot with additional toppings if desired."
\`\`\``;

const EXAMPLE_1 = {
  input: `\`\`\`yaml
  recipe:
    name: Chocolate Brownies
    description: A creamy delight with milk, egg yolks, and vanilla, perfect for a chilled dessert treat.
  \`\`\``,
  output: OUTPUT_1,
};

const EXAMPLE_2 = {
  input: `\`\`\`yaml
  recipe:
    name: Chicken Tikka Masala
    description: A flavorful Indian curry dish with marinated chicken pieces cooked in a creamy tomato sauce.
  \`\`\``,
  output: OUTPUT_2,
};

const EXAMPLE_3 = {
  input: `\`\`\`yaml
  recipe:
    name: Arepas
    description: A traditional Colombian breakfast made from maize dough, often filled with cheese or other ingredients.
  \`\`\``,
  output: OUTPUT_3,
};

const FORMAT_INSTRUCTIONS = `Provide the recipe back in YAML format following the order keys in the below recipe yaml. Keys should be camelCase. Keep lists (e.g. ingredients, instructions) flat with no nesting.
\`\`\`yaml
recipe:
  yield: "String indicating how many servings or the quantity yielded"
  activeTime: "ISO 8601 duration format (e.g., PT15M for 15 minutes)"
  cookTime: "ISO 8601 duration format (e.g., PT1H for 1 hour)"
  totalTime: "ISO 8601 duration format (e.g., PT1H15M for 1 hour 15 minutes)"
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
