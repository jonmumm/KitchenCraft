import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { StructuredObjectStream } from "@/lib/structured-object-stream";
import { z, ZodSchema } from "zod";
import { buildInput } from "./utils";

export const RecipeIdeasMetadataOutputSchema = z.object({
  ideas: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    })
  ),
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

Each recipe idea should have both a 'name' and a 'description' and nothing more.

Here is an example response given 'egg and feta' as the user input:

{
  "ideas": [
    {
      "name": "Feta Omelette",
      "description": "Fluffy eggs, crumbled feta, spinach, tomatoes. Breakfast classic."
    },
    {
      "name": "Egg Feta Muffins",
      "description": "Whisked eggs, feta, veggies. Baked in muffin tins."
    },
    {
      "name": "Spinach Egg Pie",
      "description": "Layered phyllo, spinach, eggs, feta. Golden crust delight."
    },
    {
      "name": "Feta Scramble",
      "description": "Soft scrambled eggs, feta, herbs. Creamy and savory."
    },
    {
      "name": "Egg Feta Tart",
      "description": "Shortcrust, eggs, feta, olives. Mediterranean-inspired pastry."
    },
    {
      "name": "Egg-Feta Soufflé",
      "description": "Airy eggs, feta. Puffed up gourmet elegance."
    }
  ]
}
`;
