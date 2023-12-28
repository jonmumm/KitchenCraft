import { StreamingTextResponse, writeChunk } from "@/lib/streams";
import { TokenParser } from "@/lib/token-parser";
import { getObjectHash, noop } from "@/lib/utils";
import {
  CompletedRecipeSchema,
  SuggestionPredictionOutputSchema,
} from "@/schema";
import { DietaryAlternativesPredictionInput } from "@/types";
import { kv } from "@/lib/kv";
import { NextRequest } from "next/server";
import { DietaryAlternativesTokenStream } from "./stream";

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(
  _: NextRequest,
  { params }: { params: { slug: string } }
) {
  const recipeKey = `recipe:${params.slug}`;
  const recipe = CompletedRecipeSchema.parse(await kv.hgetall(recipeKey));

  const input = {
    recipe,
  } satisfies DietaryAlternativesPredictionInput;

  const resultId = getObjectHash(input);

  const { readable, writable } = new TransformStream();
  console.log({ input, resultId });
  const writer = writable.getWriter();

  const parser = new TokenParser(SuggestionPredictionOutputSchema);
  const charArray: string[] = [];

  const process = async (stream: AsyncIterable<string>) => {
    console.log("processing...");
    for await (const chunk of stream) {
      console.log(chunk);
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
  const response = new StreamingTextResponse(readable);

  console.log("writing first chunk...");
  writeChunk(writer, resultId).then(noop);

  const dietaryAlternativesStream = new DietaryAlternativesTokenStream();

  console.log("getting stream");
  const stream = await dietaryAlternativesStream.getStream(input);
  console.log("got stream");
  process(stream);

  return response;
}
