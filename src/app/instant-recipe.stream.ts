import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { StructuredObjectStream } from "@/lib/structured-object-stream";
import { z, ZodSchema } from "zod";

export const InstantRecipeOutputSchema = z.object({
  name: z.string().describe("Name of the recipe"),
  description: z.string().describe("Short description of the recipe"),
  yield: z
    .string()
    .describe("String indicating how many servings or the quantity yielded"),
  activeTime: z
    .string()
    .describe("ISO 8601 duration format (e.g., PT15M for 15 minutes)"),
  cookTime: z
    .string()
    .describe("ISO 8601 duration format (e.g., PT1H for 1 hour)"),
  totalTime: z
    .string()
    .describe(
      "ISO 8601 duration format (e.g., PT1H15M for 1 hour and 15 minutes)"
    ),
  ingredients: z
    .array(z.string())
    .describe("The list of ingredients in the recipe"),
  instructions: z
    .array(z.string())
    .describe("The list of steps to make the recipe"),
  tags: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe(
      "3 to 5 tags that are thematic to the recipe. Always include at least one dietary tag (e.g., Vegetarian, Vegan, Gluten-Free) if applicable, and one meal type tag (e.g., Breakfast, Dessert, Appetizer)."
    ),
});

export type InstantRecipeOutput = z.infer<typeof InstantRecipeOutputSchema>;

export type InstantRecipeStreamInput = {
  prompt: string;
};

export const INSTANT_RECIPE = "INSTANT_RECIPE";

export type InstantRecipeEvent = StreamObservableEvent<
  typeof INSTANT_RECIPE,
  InstantRecipeOutput
>;

export class InstantRecipeStream extends StructuredObjectStream<
  InstantRecipeStreamInput,
  InstantRecipeOutput
> {
  protected getSchema(): ZodSchema {
    return InstantRecipeOutputSchema;
  }

  protected async getUserMessage(
    input: InstantRecipeStreamInput
  ): Promise<string> {
    return input.prompt;
  }

  protected async getSystemMessage(
    input: InstantRecipeStreamInput
  ): Promise<string> {
    return INSTANT_RECIPE_SYSTEM_TEMPLATE(input);
  }

  protected getName(): string {
    return INSTANT_RECIPE;
  }
}

const INSTANT_RECIPE_SYSTEM_TEMPLATE = (
  input: InstantRecipeStreamInput
): string => `
You are an expert chef assistant. The user will provide input including a set of ingredients, dish names, cooking equipment, preferences, or techniques. Produce a recipe that closely matches the intent of the input. Include only 1 dish in the response.

CRITICAL: You MUST include 3 to 5 tags for the recipe. These tags are REQUIRED and should always be present in your response. Include at least one dietary tag (e.g., Vegetarian, Vegan, Gluten-Free) if applicable, and one meal type tag (e.g., Breakfast, Dessert, Appetizer). Failure to include tags will result in an error.

Example input and output:
Input: blueberry pancakes
Output: 
{
  "name": "Fluffy Blueberry Pancakes",
  "description": "Light and fluffy pancakes bursting with fresh blueberries, perfect for a weekend breakfast treat.",
  "yield": "4 servings (12 pancakes)",
  "activeTime": "PT20M",
  "cookTime": "PT15M",
  "totalTime": "PT35M",
  "ingredients": [
    "2 cups all-purpose flour",
    "2 tablespoons sugar",
    "2 teaspoons baking powder",
    "1/2 teaspoon salt",
    "2 large eggs",
    "1 3/4 cups milk",
    "1/4 cup melted butter",
    "1 teaspoon vanilla extract",
    "1 1/2 cups fresh blueberries",
    "Butter or oil for cooking",
    "Maple syrup for serving"
  ],
  "instructions": [
    "In a large bowl, whisk together flour, sugar, baking powder, and salt.",
    "In another bowl, beat the eggs, then add milk, melted butter, and vanilla. Mix well.",
    "Pour the wet ingredients into the dry ingredients and stir until just combined. Do not overmix; some small lumps are okay.",
    "Gently fold in the blueberries.",
    "Heat a non-stick skillet or griddle over medium heat. Lightly grease with butter or oil.",
    "For each pancake, pour about 1/4 cup of batter onto the skillet.",
    "Cook until bubbles form on the surface, then flip and cook until golden brown on both sides.",
    "Serve warm with maple syrup."
  ],
  "tags": [
    "Breakfast",
    "Vegetarian",
    "Fruit",
    "American",
    "Family-Friendly"
  ]
}

Ensure that your response follows this format exactly, including all fields and appropriate tags. The tags field is MANDATORY and must not be omitted under any circumstances.
`;
