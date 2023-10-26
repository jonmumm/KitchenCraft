import Generator from "@/components/generator";
import { assert } from "@/lib/utils";
import { SuggestionPredictionOutputSchema } from "@/schema";
import {
  SuggestionPredictionInput,
  SuggestionPredictionOutput,
  SuggestionPredictionPartialOutput,
} from "@/types";
import EventSource from "@sanity/eventsource";
import { Ollama } from "langchain/llms/ollama";
import { ChatPromptTemplate, PromptTemplate } from "langchain/prompts";
import Replicate from "replicate";
import { z } from "zod";

const replicate = new Replicate();

type Props = {
  input: SuggestionPredictionInput;
  onStart?: () => void;
  onError?: (error: Error, outputRaw: string) => void;
  onProgress?: (output: SuggestionPredictionPartialOutput) => void;
  onComplete?: (output: SuggestionPredictionOutput) => void;
};

export default async function SuggestionsGenerator<
  TOutput extends z.ZodRawShape,
  TPartialSchema extends z.ZodTypeAny,
>({ input, ...props }: Props) {
  const stream = await getSuggestionsStream({
    input,
  });

  return (
    <Generator
      stream={stream}
      schema={SuggestionPredictionOutputSchema}
      {...props}
    />
  );
}

async function getSuggestionsStream(props: {
  input: SuggestionPredictionInput;
}) {
  if (process.env.NODE_ENV === "production") {
    return getReplicateStream(props);
  } else {
    return getOllamaStream(props);
  }
}

async function getReplicateStream({
  input,
}: {
  input: SuggestionPredictionInput;
}) {
  try {
    const response = await replicate.predictions.create({
      version:
        "7afe21847d582f7811327c903433e29334c31fe861a7cf23c62882b181bacb88",
      stream: true,
      input: {
        temperature: 0.2,
        max_new_tokens: 512,
        // system_prompt: await systemPromptTemplate.format({}),
        prompt_template: CHAIN_TEMPLATE,
        prompt: input.prompt,
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

function eventSourceToAsyncIterable(stream: string): AsyncIterable<string> {
  return {
    [Symbol.asyncIterator](): AsyncIterator<string> {
      let eventQueue: any[] = [];
      let resolve: Function | null = null;
      const source = new EventSource(stream, { withCredentials: true });

      source.addEventListener("output", (e) => {
        // console.log(e.data);
        if (resolve) {
          resolve({ value: e.data, done: false });
          resolve = null;
        } else {
          eventQueue.push(e.data);
        }
      });

      source.addEventListener("error", () => {
        if (resolve) {
          resolve({ value: null, done: true });
          resolve = null;
        }
      });

      source.addEventListener("done", () => {
        if (resolve) {
          resolve({ value: null, done: true });
          resolve = null;
        }
        source.close();
      });

      return {
        async next() {
          if (eventQueue.length > 0) {
            return { value: eventQueue.shift(), done: false };
          }

          return new Promise((res) => {
            resolve = res;
          });
        },
      };
    },
  };
}

const CHAIN_TEMPLATE = `<|im_start|>system:
You will be provided with an input related to food – this can include ingredients, dish names, cooking techniques, or other culinary themes. Your task is to generate six distinct recipes that align with the given input.

Format the response in a YAML block. Each recipe suggestion should have both a 'name' and a 'description'. The top-level key should be "suggestions". Ensure the YAML format has appropriate white space for the list items under suggestions.

\`\`\`yaml
suggestions:
  - name: Recipe Name 1
    description: Description of recipe 1.
  - name: Recipe Name 2
    description: Description of recipe 2.
  ... [and so forth for all six recipes]
\`\`\`

Example: 

\`\`\`yaml
suggestions:
  - name: Chocolate Lava Cake
    description: A warm, gooey chocolate cake with a melted center that is perfect for sharing.
  - name: Chocolate Mousse
    description: Light and fluffy chocolate mousse served in individual ramekins or as part of a dessert platter.
  - name: Chocolate Brownies
    description: Rich, fudgy brownies made with melted chocolate and topped with frosting.
  - name: Chocolate Fondue
    description: Warm, creamy chocolate served with fruit skewers, cookies, or other favorite dipping treats.
  - name: Chocolate Cake Pops
    description: Miniature cakes made from chocolate cake crumbs and topped with frosting and sprinkles.
  - name: Chocolate Tiramisu
    description: Classic Italian dessert made with layers of coffee-soaked ladyfingers, mascarpone cheese, and rich chocolate sauce.
\`\`\`
<|im_end|>
<|im_start|>user:
{prompt}<|im_end|>
<|im_start|>assistant:
`;

async function getOllamaStream({
  input,
}: {
  input: SuggestionPredictionInput;
}) {
  const llm = new Ollama({
    baseUrl: "http://localhost:11434",
    model: "mistral-openorca",
  });

  const promptTemplate = PromptTemplate.fromTemplate(CHAIN_TEMPLATE);
  const chain = promptTemplate.pipe(llm);
  const stream = await chain.stream({
    ...input,
  });

  return stream as AsyncIterable<string>;
}

// const chatPrompt = ChatPromptTemplate.fromMessages([
//   [
//     "system",
//     `You will be provided with an input related to food – this can include ingredients, dish names, cooking techniques, or other culinary themes. Your task is to generate six distinct recipes that align with the given input.

//     Format the response in a YAML block. Each recipe suggestion should have both a 'name' and a 'description'. The top-level key should be "suggestions". Ensure the YAML format has appropriate white space for the list items under suggestions.

//     \`\`\`yaml
//     suggestions:
//       - name: Recipe Name 1
//         description: Description of recipe 1.
//       - name: Recipe Name 2
//         description: Description of recipe 2.
//       ... [and so forth for all six recipes]
//     \`\`\`

//     Example:
//     \`\`\`yaml
//     suggestions:
//       - name: Chocolate Lava Cake
//         description: A warm, gooey chocolate cake with a melted center that is perfect for sharing.
//       - name: Chocolate Mousse
//         description: Light and fluffy chocolate mousse served in individual ramekins or as part of a dessert platter.
//       - name: Chocolate Brownies
//         description: Rich, fudgy brownies made with melted chocolate and topped with frosting.
//       - name: Chocolate Fondue
//         description: Warm, creamy chocolate served with fruit skewers, cookies, or other favorite dipping treats.
//       - name: Chocolate Cake Pops
//         description: Miniature cakes made from chocolate cake crumbs and topped with frosting and sprinkles.
//       - name: Chocolate Tiramisu
//         description: Classic Italian dessert made with layers of coffee-soaked ladyfingers, mascarpone cheese, and rich chocolate sauce.
//     \`\`\``,
//   ],
//   ["human", `{prompt}`],
// ]);

// Example 1
// \`\`\`yaml
// suggestions:
//   - name: Recipe Name 1
//     description: Description of recipe 1.
//   - name: Recipe Name 2
//     description: Description of recipe 2.
//   ... [and so forth for all six recipes]
// \`\`\`
