import Generator from "@/components/generator";
import { TokenStream } from "@/lib/token-stream";
import { RecipePredictionOutputSchema } from "@/schema";
import {
  NewRecipePredictionInput,
  RecipePredictionInput,
  RecipePredictionOutput,
  RecipePredictionPartialOutput,
  ScaleRecipePredictionInput,
  SubstituteRecipePredictionInput,
} from "@/types";
import Replicate from "replicate";
import { z } from "zod";
import { FORMAT_INSTRUCTIONS } from "./format-instructions";
import { EXAMPLE_1, EXAMPLE_2, EXAMPLE_3 } from "./prediction-examples";

const replicate = new Replicate();

type Props = {
  input: RecipePredictionInput;
  onStart?: () => void;
  onError?: (error: Error, outputRaw: string) => void;
  onProgress?: (output: RecipePredictionPartialOutput) => void;
  onComplete?: (output: RecipePredictionOutput) => void;
};

export default async function RecipeGenerator<
  TOutput extends z.ZodRawShape,
  TPartialSchema extends z.ZodTypeAny,
>({ input, ...props }: Props) {
  const recipeTokenStream = new RecipeTokenStream();
  const stream = await recipeTokenStream.getStream(input);

  return (
    <Generator
      stream={stream}
      schema={RecipePredictionOutputSchema}
      {...props}
    />
  );
}

export class RecipeTokenStream extends TokenStream<RecipePredictionInput> {
  protected async constructPrompt(
    input: RecipePredictionInput
  ): Promise<string> {
    switch (input.type) {
      case "NEW_RECIPE":
        return NEW_RECIPE_USER_PROMPT(input);
      case "SCALE_RECIPE":
        return SCALE_RECIPE_USER_PROMPT(input);
      case "SUBSTITUTE_RECIPE":
        return SUBSTITUTE_RECIPE_USER_PROMPT(input);
    }
  }

  protected async constructTemplate(
    input: RecipePredictionInput
  ): Promise<string> {
    switch (input.type) {
      case "NEW_RECIPE":
        return NEW_RECIPE_TEMPLATE(input);
      case "SCALE_RECIPE":
        return SCALE_RECIPE_TEMPLATE(input);
      case "SUBSTITUTE_RECIPE":
        return SUBSTITUTE_RECIPE_TEMPLATE(input);
    }
  }

  protected getDefaultTokens(): number {
    return 2048;
  }
}

const SCALE_RECIPE_USER_PROMPT = (input: ScaleRecipePredictionInput) =>
  `${input.scale}`;

const SUBSTITUTE_RECIPE_USER_PROMPT = (
  input: SubstituteRecipePredictionInput
) => `${input.substitution}`;

const NEW_RECIPE_USER_PROMPT = (input: NewRecipePredictionInput) => `
\`\`\`yaml
name: ${input.recipe.name}
description: ${input.recipe.description}
\`\`\`
`;

const SUBSTITUTE_RECIPE_TEMPLATE = (
  input: SubstituteRecipePredictionInput
) => `<|im_start|>system:
The user will provide a instructions for a substitution they would like to make in the below recipe.

Please give back the yaml for the updated recipe, applying the substitution instructions as specified by the user.

\`\`\`yaml
recipe:
  name: ${input.recipe.name}
  description: ${input.recipe.description}
  yield: ${input.recipe.yield}
  activeTime: ${input.recipe.activeTime}
  cookTime: ${input.recipe.cookTime}
  totalTime: ${input.recipe.totalTime}
  tags:
${input.recipe.tags.map((item) => `    - "${item}"`).join("\n")}
  ingredients:
${input.recipe.ingredients.map((item) => `    - "${item}"`).join("\n")}
  instructions:
${input.recipe.instructions.map((item) => `\ \ \ \ - "${item}"`).join("\n")}
\`\`\`

${FORMAT_INSTRUCTIONS}

<|im_end|>
<|im_start|>user:
{prompt}
<|im_end|>
<|im_start|>assistant:
\`\`\`yaml
`;

const SCALE_RECIPE_TEMPLATE = (
  input: ScaleRecipePredictionInput
) => `<|im_start|>system:
The user will provide a instructions for how they would like to scale the serving size for the below recipe.

Please give back the yaml for the updated recipe, applying the scale instructions as specified by the user.

\`\`\`yaml
recipe:
  name: ${input.recipe.name}
  description: ${input.recipe.description}
  yield: ${input.recipe.yield}
  activeTime: ${input.recipe.activeTime}
  cookTime: ${input.recipe.cookTime}
  totalTime: ${input.recipe.totalTime}
  tags:
${input.recipe.tags.map((item) => `    - "${item}"`).join("\n")}
  ingredients:
${input.recipe.ingredients.map((item) => `    - "${item}"`).join("\n")}
  instructions:
${input.recipe.instructions.map((item) => `    - "${item}"`).join("\n")}
\`\`\`

${FORMAT_INSTRUCTIONS}

<|im_end|>
<|im_start|>user:
{prompt}
<|im_end|>
<|im_start|>assistant:
\`\`\`yaml
`;

const NEW_RECIPE_TEMPLATE = (
  input: NewRecipePredictionInput
) => `The original prompt to come up with recipes ideas was: ${input.suggestionsInput}
The user will provide the name and description for a recipe based on the original prompt. Please generate a full recipe for this selection following the format and examples below.

Format: ${FORMAT_INSTRUCTIONS}

Here are example outputs:

Example 1: ${EXAMPLE_1.output}

Example 2: ${EXAMPLE_2.output}

Example 3: ${EXAMPLE_3.output}


User: {prompt}
AI:
`;
