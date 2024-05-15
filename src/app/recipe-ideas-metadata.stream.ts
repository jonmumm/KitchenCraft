import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { TokenStream } from "@/lib/token-stream";
import { RecipeIdeasMetadataPredictionOutputSchema } from "@/schema";
import { z } from "zod";
import { buildInput } from "./utils";

export type RecipeIdeasMetadataStreamInput = {
  prompt: string;
  tokens: string[];
  instantRecipe: {
    name: string,
    description: string,
    ingredients: string[]
  }
};

export const RecipeIdeasMetadataEventBase = "RECIPE_IDEAS_METADATA";

export type RecipeIdeasMetadataEvent = StreamObservableEvent<
  typeof RecipeIdeasMetadataEventBase,
  z.infer<typeof RecipeIdeasMetadataPredictionOutputSchema>
>;

export class RecipeIdeasMetadataStream extends TokenStream<RecipeIdeasMetadataStreamInput> {
  protected async getUserMessage(
    input: RecipeIdeasMetadataStreamInput
  ): Promise<string> {
    const promptInput = buildInput(input);
    return promptInput;
  }

  protected async getSystemMessage(
    input: RecipeIdeasMetadataStreamInput
  ): Promise<string> {
    return RECIPE_IDEAS_METADATA_SYSTEM_TEMPLATE(input);
  }

  protected getDefaultTokens(): number {
    return 2048;
  }
}

const RECIPE_IDEAS_METADATA_SYSTEM_TEMPLATE = (
  input: RecipeIdeasMetadataStreamInput
): string => `You are a creative, helpful and practical home kitchen assistant.

The user will give you a prompt. Help think of 5 more recipe ideas as it relates to that prompt, but that are different from this existing recipe.

Existing Recipe:
${input.instantRecipe.name}
${input.instantRecipe.description}
Ingredients: ${input.instantRecipe.ingredients.join(", ")}

Format the response in a YAML block. Each recipe idea should have both a 'name' and a 'description' and nothing more. 
The top-level key should be "ideas". Ensure the YAML format has appropriate white space for the list items under suggestions.

Here is an example response given 'egg and feta' as the user input:

\`\`\`yaml
ideas:
  - name: "Feta Omelette"
    description: "Fluffy eggs, crumbled feta, spinach, tomatoes. Breakfast classic."
  - name: "Egg Feta Muffins"
    description: "Whisked eggs, feta, veggies. Baked in muffin tins."
  - name: "Spinach Egg Pie"
    description: "Layered phyllo, spinach, eggs, feta. Golden crust delight."
  - name: "Feta Scramble"
    description: "Soft scrambled eggs, feta, herbs. Creamy and savory."
  - name: "Egg Feta Tart"
    description: "Shortcrust, eggs, feta, olives. Mediterranean-inspired pastry."
  - name: "Egg-Feta Soufflé"
    description: "Airy eggs, feta. Puffed up gourmet elegance."
\`\`\`
`;