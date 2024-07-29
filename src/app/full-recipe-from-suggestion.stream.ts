import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { StructuredObjectStream } from "@/lib/structured-object-stream";
import { z, ZodSchema } from "zod";

export const RecipeOutputSchema = z.object({
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
  tags: z.array(z.string()).describe("Tags related to the recipe"),
  ingredients: z
    .array(z.string())
    .describe("The list of ingredients in the recipe"),
  instructions: z
    .array(z.string())
    .describe("The list of steps to make the recipe"),
});

export type RecipeOutput = z.infer<typeof RecipeOutputSchema>;

export type FullRecipeFromSuggestionInput = {
  category: string;
  name: string;
  tagline: string;
  personalizationContext: string;
};

export const FULL_RECIPE_FROM_SUGGESTION = "FULL_RECIPE_FROM_SUGGESTION";

export type FullRecipeFromSuggestionEvent = StreamObservableEvent<
  typeof FULL_RECIPE_FROM_SUGGESTION,
  RecipeOutput
>;

export class FullRecipeFromSuggestionStream extends StructuredObjectStream<
  FullRecipeFromSuggestionInput,
  RecipeOutput
> {
  protected getSchema(): ZodSchema {
    return RecipeOutputSchema;
  }

  protected async getUserMessage(
    input: FullRecipeFromSuggestionInput
  ): Promise<string> {
    const message = USER_TEMPLATE(input);
    console.log({ message });
    return message;
  }

  protected async getSystemMessage(
    input: FullRecipeFromSuggestionInput
  ): Promise<string> {
    return SYSTEM_TEMPLATE(input);
  }

  protected getName(): string {
    return FULL_RECIPE_FROM_SUGGESTION;
  }
}

const USER_TEMPLATE = (
  input: FullRecipeFromSuggestionInput
) => `Personalization Context: ${input.personalizationContext}

---
{
  "name": "${input.name}",
  "category": "${input.category}",
  "tagline": "${input.tagline}"
}
`;

const SYSTEM_TEMPLATE = (
  input: FullRecipeFromSuggestionInput
) => `You are an expert chef assistant. The user will provide the name, category, and tagline for a recipe.

The user will also include some context about themselves that may or may not be relevant—use this to personalize the recipe as necessary.

Example output:
${EXAMPLE_OUTPUT}`;

const EXAMPLE_OUTPUT = `{
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
}`;
