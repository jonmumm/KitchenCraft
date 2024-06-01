import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { StructuredObjectStream } from "@/lib/structured-object-stream";
import { z, ZodSchema } from "zod";
import { buildInput } from "./utils";

export const RecipeIdeasMetadataOutputSchema = z.object({
  ideas: z
    .array(
      z.object({
        name: z.string().describe("Name of the recipe"),
        description: z.string().describe("Short description of the recipe"),
        matchPercent: z
          .number()
          .min(0)
          .max(100)
          .describe(
            "A number from 0-100 describing how closely this recipe suggestion is relative to the user's input."
          ),
      })
    )
    .describe("A list of 5 recipe ideas"),
});

export type RecipeIdeasMetadataOutput = z.infer<
  typeof RecipeIdeasMetadataOutputSchema
>;

export type RecipeIdeasMetadataStreamInput = {
  prompt: string;
  tokens: string[];
  instantRecipe: {
    name: string;
    description: string;
    ingredients: string[];
  };
};

export const RECIPE_IDEAS_METADATA = "RECIPE_IDEAS_METADATA";

export type RecipeIdeasMetadataEvent = StreamObservableEvent<
  typeof RECIPE_IDEAS_METADATA,
  RecipeIdeasMetadataOutput
>;

export class RecipeIdeasMetadataStream extends StructuredObjectStream<
  RecipeIdeasMetadataStreamInput,
  RecipeIdeasMetadataOutput
> {
  protected getSchema(): ZodSchema {
    return RecipeIdeasMetadataOutputSchema;
  }

  protected async getUserMessage(
    input: RecipeIdeasMetadataStreamInput
  ): Promise<string> {
    return buildInput(input);
  }

  protected async getSystemMessage(
    input: RecipeIdeasMetadataStreamInput
  ): Promise<string> {
    return RECIPE_IDEAS_METADATA_SYSTEM_TEMPLATE(input);
  }

  protected getName(): string {
    return RECIPE_IDEAS_METADATA;
  }
}

const RECIPE_IDEAS_METADATA_SYSTEM_TEMPLATE = (
  input: RecipeIdeasMetadataStreamInput
): string => `
You are a creative, helpful, and practical home kitchen assistant.

The user will give you a prompt. Help think of 5 more recipe ideas as it relates to that prompt, but that are different from this existing recipe.

Existing Recipe:
${input.instantRecipe.name}
${input.instantRecipe.description}
Ingredients: ${input.instantRecipe.ingredients.join(", ")}

Each recipe idea should have a 'name', a 'description', an 'explanation', and a 'matchPercent' and nothing more.

Here is an example response given 'chicken and broccoli' as the user input:

{
  "ideas": [
    {
      "name": "Chicken Broccoli Stir-fry",
      "description": "Tender chicken and broccoli florets stir-fried with garlic and soy sauce.",
      "matchPercent": 90
    },
    {
      "name": "Chicken Broccoli Casserole",
      "description": "Baked chicken and broccoli with a creamy cheese sauce.",
      "matchPercent": 85
    },
    {
      "name": "Lemon Herb Chicken with Broccoli",
      "description": "Grilled chicken marinated in lemon and herbs, served with steamed broccoli.",
      "matchPercent": 80
    },
    {
      "name": "Chicken Broccoli Alfredo",
      "description": "Fettuccine pasta with grilled chicken and broccoli in a creamy Alfredo sauce.",
      "matchPercent": 78
    },
    {
      "name": "Chicken Broccoli Quinoa Bowl",
      "description": "Quinoa bowl with grilled chicken, broccoli, and a lemon-tahini dressing.",
      "matchPercent": 75
    }
  ]
}
`;
