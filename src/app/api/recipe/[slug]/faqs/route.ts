import { eventSourceToAsyncIterable } from "@/lib/event-source";
import { replicate } from "@/lib/replicate";
import { StreamingTextResponse, writeChunk } from "@/lib/streams";
import { TokenParser } from "@/lib/token-parser";
import { TokenStream } from "@/lib/token-stream";
import { assert, getObjectHash, noop } from "@/lib/utils";
import {
  CompletedRecipeSchema,
  SuggestionPredictionOutputSchema,
} from "@/schema";
import { FAQsPredictionInput, RemixIdeasPredictionInput } from "@/types";
import { kv } from "@vercel/kv";
import { Ollama } from "langchain/llms/ollama";
import { PromptTemplate } from "langchain/prompts";
import { NextRequest } from "next/server";
import { FAQsTokenStream } from "./stream";
import { getRecipe } from "@/db/queries/queries";

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(
  _: NextRequest,
  { params }: { params: { slug: string } }
) {
  const recipeKey = `recipe:${params.slug}`;
  const recipe = await getRecipe(params.slug);
  assert(recipe, "expected recipe");

  const input = {
    recipe,
  } satisfies FAQsPredictionInput;

  const resultId = getObjectHash(input);
  const resultKey = `result:${resultId}`;

  const { readable, writable } = new TransformStream();

  const writer = writable.getWriter();

  //   kv.hset(resultKey, { input, type: "substitutions", status: "running" }).then(
  //     noop
  //   );

  const parser = new TokenParser(SuggestionPredictionOutputSchema);
  const charArray: string[] = [];

  const process = async (stream: AsyncIterable<string>) => {
    for await (const chunk of stream) {
      for (const char of chunk) {
        charArray.push(char);
      }
      await writeChunk(writer, chunk);
      const outputRaw = charArray.join("");
      //   kv.hset(resultKey, { outputRaw }).then(noop);
    }

    const outputRaw = charArray.join("");
    // kv.hset(resultKey, { outputRaw }).then(noop);

    try {
      parser.parse(outputRaw);
      //   kv.hset(resultKey, { status: "done", outputRaw });
    } catch (ex) {
      //   kv.hset(resultKey, { status: "error", error: getErrorMessage(ex) });
    }
    writer.close();
  };

  writeChunk(writer, resultId).then(noop);

  const tokenStream = new FAQsTokenStream();
  const stream = await tokenStream.getStream(input);

  process(stream);

  return new StreamingTextResponse(readable);
}
