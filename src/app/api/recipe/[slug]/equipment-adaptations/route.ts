import { StreamingTextResponse, writeChunk } from "@/lib/streams";
import { TokenParser } from "@/lib/token-parser";
import { getObjectHash, noop } from "@/lib/utils";
import {
  CompletedRecipeSchema,
  SuggestionPredictionOutputSchema,
} from "@/schema";
import { EquipmentAdaptationsPredictionInput } from "@/types";
import { kv } from "@/lib/kv";
import { NextRequest } from "next/server";
import { EquipmentAdaptationsTokenStream } from "./stream";

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
  } satisfies EquipmentAdaptationsPredictionInput;

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

  const tokenStream = new EquipmentAdaptationsTokenStream();
  const stream = await tokenStream.getStream(input);
  process(stream);

  return new StreamingTextResponse(readable);
}
