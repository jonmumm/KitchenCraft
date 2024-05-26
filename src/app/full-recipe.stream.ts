import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { StructuredObjectStream } from "@/lib/structured-object-stream";
import { z, ZodSchema } from "zod";
import { buildInput } from "./utils";

export const RecipeOutputSchema = z.object({
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

export type FullRecipeStreamInput = {
  prompt: string;
  tokens: string[];
  name: string;
  description: string;
};

export const FULL_RECIPE = "FULL_RECIPE";

export type FullRecipeEvent = StreamObservableEvent<
  typeof FULL_RECIPE,
  RecipeOutput
>;

export class FullRecipeStream extends StructuredObjectStream<
  FullRecipeStreamInput,
  RecipeOutput
> {
  protected getSchema(): ZodSchema {
    return RecipeOutputSchema;
  }

  protected async getUserMessage(
    input: FullRecipeStreamInput
  ): Promise<string> {
    return NEW_RECIPE_USER_PROMPT_TEMPLATE(input);
  }

  protected async getSystemMessage(
    input: FullRecipeStreamInput
  ): Promise<string> {
    return NEW_RECIPE_TEMPLATE(input);
  }

  protected getName(): string {
    return FULL_RECIPE;
  }
}

const NEW_RECIPE_USER_PROMPT_TEMPLATE = (input: FullRecipeStreamInput) => `
${buildInput(input)}

{
  "name": "${input.name}",
  "description": "${input.description}"
}
`;

const NEW_RECIPE_TEMPLATE = (
  input: FullRecipeStreamInput
) => `You are an expert chef assistant. The user will provide the name and description for a recipe.

Come up with a recipe that matches the user's prompt following the format and example below. The instruction steps must include the ingredient quantity. Format it in JSON and include nothing else in the response.

Example output:

${EXAMPLE_OUTPUT}`;

const EXAMPLE_OUTPUT = `{
  "yield": "4 servings",
  "activeTime": "PT20M",
  "cookTime": "PT40M",
  "totalTime": "PT1H",
  "tags": ["Main Course", "Indian", "Spicy"],
  "ingredients": ["500g boneless chicken, cubed", "150g plain yogurt", "2 tbsp lemon juice", "2 tbsp vegetable oil", "1 large onion, finely chopped", "3 garlic cloves, minced", "1 tbsp ginger paste", "2 tsp garam masala", "1 tsp turmeric powder", "1 tsp red chili powder", "200g canned tomatoes, pureed", "100ml heavy cream", "Salt to taste", "Fresh coriander leaves for garnish"],
  "instructions": ["In a bowl, marinate the 500g cubed chicken with 150g yogurt, 2 tbsp lemon juice, and half (1 tsp) of the garam masala. Let it sit for at least 2 hours.", "Heat 2 tbsp oil in a pan and fry the chicken pieces until golden brown. Remove and set aside.", "In the same pan, sauté the chopped onion until translucent. Add 1 tbsp ginger and 3 garlic cloves, and fry for a couple of minutes.", "Add the spices (1 tsp turmeric, 1 tsp red chili powder, remaining (1 tsp) garam masala) and sauté for a minute.", "Pour in the 200g tomato puree, salt, and let it simmer for 10 minutes.", "Add the fried chicken pieces and 100ml cream. Cook for another 10-15 minutes until the chicken is tender.", "Garnish with fresh coriander leaves before serving."]
}`;
