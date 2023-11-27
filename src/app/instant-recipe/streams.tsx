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

Format the response in YAML block with the name and description as the only root-level keys. The description should be a blurb that is 12 words or less. See below of an example for the following prompt:

"Give me a simple tomato soup recipe"

\`\`\`yaml
name: Classic Tomato Soup
description: Simmered tomatoes, onions, garlic, vegetable broth. Pureer to velvety perfection.
\`\`\`;
`;
