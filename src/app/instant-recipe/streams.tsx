import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { TokenStream } from "@/lib/token-stream";
import { InstantRecipeMetadataPredictionOutputSchema } from "@/schema";
import { InstantRecipeMetadataPredictionInput, PartialRecipe } from "@/types";
import { z } from "zod";
import { buildInput } from "../utils";

type Input = {
  prompt: string;
  tokens: string[];
  previousRejections: PartialRecipe[];
  personalizationContext: string;
  timeContext: string;
};

export const InstantRecipeMetadataEventBase = "INSTANT_RECIPE_METADATA";

export type InstantRecipeMetadataEvent = StreamObservableEvent<
  typeof InstantRecipeMetadataEventBase,
  z.infer<typeof InstantRecipeMetadataPredictionOutputSchema>
>;

export class InstantRecipeMetadataStream extends TokenStream<InstantRecipeMetadataPredictionInput> {
  protected async getUserMessage(input: Input): Promise<string> {
    const message =
      buildInput(input) +
      `${input.personalizationContext ? input.personalizationContext : ""}` +
      `${input.timeContext ? input.timeContext : ""}` +
      (input.previousRejections.length
        ? `
        
        I have already seen and skipped the following recipes:
  ${input.previousRejections
    .map((partialRecipe) => {
      let recipeDetails = [];
      if (partialRecipe.name) {
        recipeDetails.push(`${partialRecipe.name}`);
      }
      // if (partialRecipe.description) {
      //   recipeDetails.push(`Description: ${partialRecipe.description}`);
      // }
      return recipeDetails.join("\n");
    })
    .join("\n\n")}
  `
        : "");
    return message;
  }

  protected async getSystemMessage(input: Input): Promise<string> {
    return TEMPLATE(input);
  }

  protected getDefaultTokens(): number {
    return 2048;
  }
}

const TEMPLATE = (input: Input) => `
You are an expert chef assistant. You will be provided with a prompt from the user and you should come up with a name and description for a recipe that most closely matches the prompt.

${
  input.previousRejections.length
    ? "The user will also include previous recipes they've already seen and rejected—consider adapting the recipe to be somehow different than ones that were already seen and skipped."
    : ""
}

Format the response in YAML block with the name and description as the only root-level keys. Do not include nest items in the description or list more than one dish. The description should be a blurb that is 12 words or less. See the below examples

Prompt: "tomato soup recipe"

Response: 

\`\`\`yaml
name: Classic Tomato Soup
description: Simmered tomatoes, onions, garlic, vegetable broth. Pureer to velvety perfection.
\`\`\`;

Prompt: "vegan meal"

Response:

\`\`\`yaml
name: Quinoa Stuffed Bell Peppers
description: Colorful bell peppers filled with a hearty mixture of quinoa, black beans, corn, and Mexican spices, topped with melted cheese and baked to perfection.
\`\`\`;

Prompt: "chicken, broccoli, soy sauce, garlic, and rice"

Response:

\`\`\`yaml
name: Quick Chicken Broccoli Stir-Fry
description: Tender chicken stir-fried with fresh broccoli and garlic, seasoned with soy sauce and served over fluffy white rice.
\`\`\`;

${
  input.personalizationContext
    ? "Consider the user's provided personalized preference inputs."
    : ""
}

Ensure the response is a yaml code block.
`;
