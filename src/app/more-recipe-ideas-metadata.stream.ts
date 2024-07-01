import { RECIPE_IDEAS_METADATA } from "@/constants/events";
import { StructuredObjectStream } from "@/lib/structured-object-stream";
import { RecipeIdeasMetadataOutputSchema } from "@/schema";
import { RecipeIdeasMetadataOutput } from "@/types";
import { ZodSchema } from "zod";

export type Recipe = {
  name: string;
  description: string;
  matchPercent: number;
};

export type MoreRecipeIdeasMetadataStreamInput = {
  prompt: string;
  previousRecipes: Recipe[];
};

export class MoreRecipeIdeasMetadataStream extends StructuredObjectStream<
  MoreRecipeIdeasMetadataStreamInput,
  RecipeIdeasMetadataOutput
> {
  protected getSchema(): ZodSchema {
    return RecipeIdeasMetadataOutputSchema;
  }

  protected async getUserMessage(
    input: MoreRecipeIdeasMetadataStreamInput
  ): Promise<string> {
    return input.prompt;
  }

  protected async getSystemMessage(
    input: MoreRecipeIdeasMetadataStreamInput
  ): Promise<string> {
    return MORE_RECIPE_IDEAS_METADATA_SYSTEM_TEMPLATE(input);
  }

  protected getName(): string {
    return RECIPE_IDEAS_METADATA;
  }
}

const MORE_RECIPE_IDEAS_METADATA_SYSTEM_TEMPLATE = (
  input: MoreRecipeIdeasMetadataStreamInput
): string => {
  const lowestPreviousMatchPercent = Math.min(
    ...input.previousRecipes.map((r) => r.matchPercent)
  );
  const upperBound = lowestPreviousMatchPercent;
  const lowerBound = Math.max(upperBound - 20, 0); // Ensure lowerBound doesn't go below 0

  return `
You are a creative, innovative, and practical home kitchen assistant.

The user will give you a prompt: "${
    input.prompt
  }". Your task is to think of 5 more diverse recipe ideas that relate to that prompt but are significantly different from the given existing recipes. Aim for variety in cooking methods, cuisines, and dish types.

Previously Generated Recipes:
${input.previousRecipes
  .map(
    (recipe) =>
      `${recipe.name}\n${recipe.description}\nMatch Percent: ${recipe.matchPercent}%`
  )
  .join("\n\n")}

Guidelines for generating new recipe ideas:
1. Avoid direct variations of the existing recipes. Instead, explore different dish types that incorporate the main theme or ingredients.
2. Consider various cooking methods: baking, grilling, frying, slow-cooking, no-cook, etc.
3. Explore different cuisines and cultural influences.
4. Think about transforming the concept into different meal types: breakfast, lunch, dinner, snack, dessert.
5. Consider various dietary preferences: vegetarian, vegan, low-carb, gluten-free, etc.

Each new recipe idea should have a 'name', a 'description', and a 'matchPercent' and nothing more.
Assign matchPercents within the range of ${lowerBound}% to ${upperBound}%, with lower values indicating ideas that are less close to the original prompt.

To determine the matchPercent, consider the following:
1. Main Ingredients: Does the recipe include the primary ingredients from the prompt?
2. Secondary Ingredients: Are the additional ingredients complementary or common variations?
3. Flavor Profile: Does the flavor profile (e.g., savory, tangy) remain consistent with the prompt?
4. Uniqueness: Is the recipe different from the previously generated recipes?
5. Previous Match Percentages: How does this recipe compare to the match percentages of previously generated recipes?

Use the following guidelines for assigning percentages within the given range:
- Higher percentages (closer to ${upperBound}%): Directly relates to the prompt, but in a very different form from the existing recipes. Uses the main ingredients or concepts in an innovative way.
- Mid-range percentages: Strongly relates to the prompt, with creative interpretations. May use some of the main ingredients or concepts in unexpected ways.
- Lower percentages (closer to ${lowerBound}%): Loosely relates to the prompt, with heavy creative interpretation. May only use one aspect of the prompt in a unique way.

Ensure a mix of percentages across the range for variety.

Here's an example response:

Given 'chicken and broccoli' as the user input, and assuming the lowest previous matchPercent was 65:

{
  "ideas": [
    {
      "name": "Chicken Broccoli Alfredo Pizza",
      "description": "A crispy pizza crust topped with creamy Alfredo sauce, diced chicken, broccoli florets, and mozzarella cheese.",
      "matchPercent": 64
    },
    {
      "name": "Chicken Broccoli Quesadillas",
      "description": "Tortillas filled with seasoned chicken, chopped broccoli, and melted cheese, served with salsa and sour cream.",
      "matchPercent": 59
    },
    {
      "name": "Chicken Broccoli Fried Rice",
      "description": "Stir-fried rice with chunks of chicken, broccoli florets, eggs, and a savory soy sauce.",
      "matchPercent": 54
    },
    {
      "name": "Chicken Broccoli Salad",
      "description": "A refreshing salad with grilled chicken strips, raw broccoli florets, cranberries, and a tangy yogurt dressing.",
      "matchPercent": 49
    },
    {
      "name": "Chicken Broccoli Curry",
      "description": "A spicy Indian-inspired curry with tender chicken pieces and broccoli florets in a rich tomato-based sauce.",
      "matchPercent": 46
    }
  }
}
`;
};
