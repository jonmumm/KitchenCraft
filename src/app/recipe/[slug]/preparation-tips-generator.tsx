import Generator from "@/components/generator";
import { eventSourceToAsyncIterable } from "@/lib/event-source";
import { assert } from "@/lib/utils";
import { TipsPredictionOutputSchema } from "@/schema";
import {
    TipsPredictionInput,
    TipsPredictionOutput,
    TipsPredictionPartialOutput,
} from "@/types";
import { Ollama } from "langchain/llms/ollama";
import { PromptTemplate } from "langchain/prompts";
import Replicate from "replicate";

const replicate = new Replicate();

type Props = {
  input: TipsPredictionInput;
  onStart?: () => void;
  onError?: (error: Error, outputRaw: string) => void;
  onProgress?: (output: TipsPredictionPartialOutput) => void;
  onComplete?: (output: TipsPredictionOutput) => void;
};

export default async function PreparationTipsGenerator({
  input,
  ...props
}: Props) {
  const stream = await getPreparationTipsStream({
    input,
  });

  return (
    <Generator stream={stream} schema={TipsPredictionOutputSchema} {...props} />
  );
}

async function getPreparationTipsStream(props: { input: TipsPredictionInput }) {
  if (process.env.NODE_ENV === "production") {
    return getReplicateStream(props);
  } else {
    return getOllamaStream(props);
  }
}

async function getReplicateStream({ input }: { input: TipsPredictionInput }) {
  try {
    const response = await replicate.predictions.create({
      version:
        "7afe21847d582f7811327c903433e29334c31fe861a7cf23c62882b181bacb88",
      stream: true,
      input: {
        temperature: 0.2,
        max_new_tokens: 2048,
        prompt_template: REMIX_IDEAS_TEMPLATE,
        prompt: await userMessageTemplate.format({
          name: input.recipe.name,
          description: input.recipe.description,
          tags: input.recipe.tags.join("\n"),
          ingredients: input.recipe.ingredients.join("\n"),
          instructions: input.recipe.instructions.join("\n"),
        }),
      },
    });
    const { stream } = response.urls;
    assert(stream, "expected streamUrl");

    return eventSourceToAsyncIterable(stream);
  } catch (ex) {
    console.warn(ex);
    throw ex;
  }
}

const userMessageTemplate = PromptTemplate.fromTemplate(`
\`\`\`yaml
recipe:
  name: {name}
  description: {description}
  ingredients: {ingredients}
  instructions: {instructions}
\`\`\`
`);

const REMIX_IDEAS_TEMPLATE = `<|im_start|>system:
You will be provided with a recipe. Please return back a list of the most practical tips as it relates to this recipe. No more than 4.

Each tip should be 3-7 words.  Format the response in a yaml block with "tips" as the root level key for the list. Ensure valid yaml formatting.

\`\`\`yaml
tips:
  - "..."
  - "..."
  - "..."
\`\`\`

<|im_end|>
<|im_start|>user:
{prompt}<|im_end|>
<|im_start|>assistant:

\`\`\`yaml
`;

async function getOllamaStream({ input }: { input: TipsPredictionInput }) {
  const llm = new Ollama({
    baseUrl: "http://localhost:11434",
    model: "mistral-openorca",
  });

  const chainTemplate = PromptTemplate.fromTemplate(REMIX_IDEAS_TEMPLATE);
  const chain = chainTemplate.pipe(llm);

  const stream = await chain.stream({
    prompt: await userMessageTemplate.format({
      name: input.recipe.name,
      description: input.recipe.description,
      tags: input.recipe.tags.join("\n"),
      ingredients: input.recipe.ingredients.join("\n"),
      instructions: input.recipe.instructions.join("\n"),
    }),
  });

  return stream as AsyncIterable<string>;
}
