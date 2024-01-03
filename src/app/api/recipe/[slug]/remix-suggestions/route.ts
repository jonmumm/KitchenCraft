import { getRecipe } from "@/db/queries";
import { getErrorMessage } from "@/lib/error";
import { kv } from "@/lib/kv";
import { StreamingTextResponse, writeChunk } from "@/lib/streams";
import { TokenParser } from "@/lib/token-parser";
import { assert, getObjectHash, noop } from "@/lib/utils";
import { SuggestionPredictionOutputSchema } from "@/schema";
import { RemixSuggestionsPredictionInput } from "@/types";
import { NextRequest } from "next/server";
import { RemixSuggestionsTokenStream } from "./stream";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const recipe = await getRecipe(params.slug);
  assert(recipe, "expected recipe");

  const input = {
    recipe,
  } satisfies RemixSuggestionsPredictionInput;
  const resultId = getObjectHash(input);

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const parser = new TokenParser(SuggestionPredictionOutputSchema);
  const charArray: string[] = [];

  const process = async (stream: AsyncIterable<string>) => {
    for await (const chunk of stream) {
      for (const char of chunk) {
        charArray.push(char);
      }
      await writeChunk(writer, chunk);

      // only write the output if it's parseable
      // if (output) {
      //   kv.hset(resultKey, { outputRaw }).then(noop);
      // }
    }

    const outputRaw = charArray.join("");
    // kv.hset(resultKey, { outputRaw }).then(noop);

    try {
      parser.parse(outputRaw);
      // await kv.hset(resultKey, { status: "done", outputRaw });
    } catch (ex) {
      // await kv.hset(resultKey, { status: "error", error: getErrorMessage(ex) });
    }
    writer.close();
  };

  writeChunk(writer, resultId).then(noop);

  const tokenStream = new RemixSuggestionsTokenStream();
  const stream = await tokenStream.getStream(input);

  process(stream);

  return new StreamingTextResponse(readable);
}
