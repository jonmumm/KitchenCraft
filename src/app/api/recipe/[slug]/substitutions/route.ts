import { getErrorMessage } from "@/lib/error";
import { writeChunk } from "@/lib/streams";
import { TokenParser } from "@/lib/token-parser";
import { getObjectHash, noop } from "@/lib/utils";
import {
  CompletedRecipeSchema,
  SuggestionPredictionOutputSchema,
} from "@/schema";
import { SubstitutionsPredictionInput } from "@/types";
import { kv } from "@vercel/kv";
import { NextRequest } from "next/server";
import { SubstitutionsTokenStream } from "./stream";

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  console.log(params.slug);
  //   const prompt = z.string().min(1).parse(params.get("prompt"));
  //   const ingredients = ingredientsParser.parseServerSide(
  //     params.get("ingredients") || undefined
  //   );
  //   const tags = tagsParser.parseServerSide(params.get("tags") || undefined);
  const recipeKey = `recipe:${params.slug}`;
  const recipe = CompletedRecipeSchema.parse(await kv.hgetall(recipeKey));

  const input = {
    recipe,
  } satisfies SubstitutionsPredictionInput;

  const resultId = getObjectHash(input);
  const resultKey = `result:${resultId}`;

  const { readable, writable } = new TransformStream();

  const writer = writable.getWriter();

  kv.hset(resultKey, { input, type: "substitutions", status: "running" }).then(
    noop
  );

  const parser = new TokenParser(SuggestionPredictionOutputSchema);
  const charArray: string[] = [];

  const process = async (stream: AsyncIterable<string>) => {
    for await (const chunk of stream) {
      for (const char of chunk) {
        charArray.push(char);
      }
      await writeChunk(writer, chunk);
      const outputRaw = charArray.join("");
      kv.hset(resultKey, { outputRaw }).then(noop);
    }

    const outputRaw = charArray.join("");
    kv.hset(resultKey, { outputRaw }).then(noop);

    try {
      parser.parse(outputRaw);
      kv.hset(resultKey, { status: "done", outputRaw });
    } catch (ex) {
      kv.hset(resultKey, { status: "error", error: getErrorMessage(ex) });
    }
  };

  writeChunk(writer, resultId).then(noop);

  const tokenStream = new SubstitutionsTokenStream();
  const stream = await tokenStream.getStream(input);

  process(stream);

  return new Response(readable, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Content-Encoding": "none",
    },
  });
}
