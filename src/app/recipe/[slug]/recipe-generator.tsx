import Generator from "@/components/generator";
import { eventSourceToAsyncIterable } from "@/lib/event-source";
import { assert } from "@/lib/utils";
import { RecipePredictionOutputSchema } from "@/schema";
import {
  RecipePredictionInput,
  RecipePredictionOutput,
  RecipePredictionPartialOutput,
} from "@/types";
import { Ollama } from "langchain/llms/ollama";
import { PromptTemplate } from "langchain/prompts";
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
>({ input, onStart, ...props }: Props) {
  const stream = await getRecipeStream({
    input,
  });

  onStart && onStart();

  return (
    <Generator
      stream={stream}
      schema={RecipePredictionOutputSchema}
      {...props}
    />
  );
}

async function getRecipeStream(props: { input: RecipePredictionInput }) {
  if (process.env.NODE_ENV === "production") {
    return getReplicateStream(props);
  } else {
    return getOllamaStream(props);
  }
}

async function getReplicateStream({ input }: { input: RecipePredictionInput }) {
  const inputPromptTemplate = PromptTemplate.fromTemplate(`Name: {name}
Description: {description}`);

  try {
    const response = await replicate.predictions.create({
      version:
        "7afe21847d582f7811327c903433e29334c31fe861a7cf23c62882b181bacb88",
      stream: true,
      // version:
      // "ac944f2e49c55c7e965fc3d93ad9a7d9d947866d6793fb849dd6b4747d0c061c", // llama 7b chat
      // "83b6a56e7c828e667f21fd596c338fd4f0039b46bcfa18d973e8e70e455fda70", // MISTRAL-instruct
      // "7afe21847d582f7811327c903433e29334c31fe861a7cf23c62882b181bacb88", // mistral open orca https://replicate.com/nateraw/mistral-7b-openorca/versions/7afe21847d582f7811327c903433e29334c31fe861a7cf23c62882b181bacb88
      // "mistralai/mistral-7b-v0.1:3e8a0fb6d7812ce30701ba597e5080689bef8a013e5c6a724fafb108cc2426a0",
      input: {
        temperature: 0.2,
        max_new_tokens: 2048,
        // system_prompt: await systemPromptTemplate.format({}),
        prompt_template: CHAIN_TEMPLATE(input.suggestionsPrompt),
        prompt: await inputPromptTemplate.format({
          name: input.name,
          description: input.description,
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

async function getOllamaStream({ input }: { input: RecipePredictionInput }) {
  const llm = new Ollama({
    baseUrl: "http://localhost:11434",
    model: "mistral-openorca",
  });

  const chainTemplate = PromptTemplate.fromTemplate(
    CHAIN_TEMPLATE(input.suggestionsPrompt)
  );
  const chain = chainTemplate.pipe(llm);

  const stream = await chain.stream({
    prompt: await userMessageTemplate.format({
      ...input,
    }),
  });

  return stream as AsyncIterable<string>;
}

const userMessageTemplate = PromptTemplate.fromTemplate(`
\`\`\`yaml
name: {name}
description: {description}
\`\`\`
`);

const CHAIN_TEMPLATE = (suggestionPrompt: string) => `<|im_start|>system:
The original prompt to come up with recipes ideas was: ${suggestionPrompt}
The user will provide the name and description for a recipe based on the original prompt. Please generate a full recipe for this selection following the format and examples below.

Format: ${FORMAT_INSTRUCTIONS}

Here are example outputs:

Example 1: ${EXAMPLE_1.output}

Example 2: ${EXAMPLE_2.output}

Example 3: ${EXAMPLE_3.output}
<|im_end|>
<|im_start|>user:
{prompt}
<|im_end|>
<|im_start|>assistant:
\`\`\`yaml
`;
