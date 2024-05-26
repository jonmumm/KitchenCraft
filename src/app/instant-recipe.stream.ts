import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { StructuredObjectStream } from "@/lib/structured-object-stream";
import { z, ZodSchema } from "zod";
import { buildInput } from "./utils";

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
  tags: z.array(z.string()).describe("Tags related to the recipe"),
});

export type InstantRecipeOutput = z.infer<typeof InstantRecipeOutputSchema>;

export type InstantRecipeStreamInput = {
  prompt: string;
  tokens: string[];
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
    return buildInput(input);
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

export const INSTANT_RECIPE_SYSTEM_TEMPLATE = (
  input: InstantRecipeStreamInput
): string => `
You are an expert chef assistant. The user will provide input including a set of ingredients, dish names, cooking equipment, preferences, or techniques. Produce a recipe that closely matches the intent of the input. Include only 1 dish in the response.

Example input and output:

Input: quinoa salad
Output: 
{
  "name": "Quinoa Salad with Avocado and Tomatoes",
  "description": "A refreshing and nutritious salad, perfect for a quick lunch or a side dish.",
  "yield": "4 servings",
  "activeTime": "PT15M",
  "cookTime": "PT20M",
  "totalTime": "PT35M",
  "ingredients": [
    "1 cup quinoa",
    "2 cups water",
    "1 avocado, diced",
    "1 cup cherry tomatoes, halved",
    "1/4 cup chopped cilantro",
    "2 tablespoons olive oil",
    "1 lime, juiced",
    "Salt and pepper to taste"
  ],
  "instructions": [
    "Rinse the quinoa under cold water until the water runs clear.",
    "Combine quinoa and water in a medium saucepan. Bring to a boil, then cover and reduce to a simmer for 15 minutes or until water is absorbed.",
    "Remove from heat and let sit, covered, for 5 minutes. Fluff with a fork and allow to cool slightly.",
    "In a large bowl, combine cooled quinoa, avocado, tomatoes, and cilantro.",
    "Drizzle with olive oil and lime juice, and season with salt and pepper. Toss gently to combine.",
    "Serve chilled or at room temperature."
  ],
  "tags": [
    "Salad",
    "Vegetarian",
    "Gluten-Free"
  ]
}
`;
