import { TokenStream } from "@/lib/token-stream";
import { InstantRecipeMetadataPredictionInput } from "@/types";

export class InstantRecipeMetadataStream extends TokenStream<InstantRecipeMetadataPredictionInput> {
  protected async getUserMessage(
    input: InstantRecipeMetadataPredictionInput
  ): Promise<string> {
    return input.prompt;
  }

  protected async getSystemMessage(
    _: InstantRecipeMetadataPredictionInput
  ): Promise<string> {
    return TEMPLATE;
  }

  protected getDefaultTokens(): number {
    return 2048;
  }
}

const TEMPLATE = `
You are an expert chef assistant. You will be provided with a prompt from the user and you should come up with a name and description for a recipe that most closely matches the prompt.

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

`;
