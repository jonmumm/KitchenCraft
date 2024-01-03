import { getTempRecipe } from "@/app/recipe/[slug]/queries";
import { RecipeTokenStream } from "@/app/recipe/[slug]/stream";
import { getResult } from "@/lib/db";
import { kv } from "@/lib/kv";
import { StreamingTextResponse, writeChunk } from "@/lib/streams";
import { TokenParser } from "@/lib/token-parser";
import { assert } from "@/lib/utils";
import {
  RecipePredictionOutputSchema,
  SuggestionPredictionInputSchema,
} from "@/schema";
import { RecipePredictionInput } from "@/types";
import { unstable_cache } from "next/cache";
import { NextRequest } from "next/server";

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(
  _: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const tempRecipe = await getTempRecipe(slug);

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const rand = Math.random();
  const cachedRand = await unstable_cache(async () => {
    return rand;
  }, ["recipe", slug])();

  const shouldCreate =
    rand === cachedRand && tempRecipe.runStatus === "initializing";

  if (shouldCreate) {
    kv.hset(`recipe:${slug}`, { runStatus: "starting" });

    const { fromResult, fromPrompt } = tempRecipe;

    let input: RecipePredictionInput | undefined;

    const charArray: string[] = [];

    if (fromResult) {
      const result = await getResult(kv, fromResult.resultId);
      const suggestionsInput = SuggestionPredictionInputSchema.parse(
        result.input
      );
      assert(suggestionsInput.prompt, "expected prompt");

      input = {
        recipe: {
          ...tempRecipe,
        },
        prompt: suggestionsInput.prompt,
      } satisfies RecipePredictionInput;
    } else if (fromPrompt) {
      input = {
        recipe: {
          ...tempRecipe,
        },
        prompt: fromPrompt,
      } satisfies RecipePredictionInput;
    } else {
      throw new Error("recipe exists but input not found");
    }

    // unstable_cache(async () => {

    // }, ["recipe", slug, "data"])
    const recipeTokenStream = new RecipeTokenStream();
    const stream = await recipeTokenStream.getStream(input);
    const parser = new TokenParser(RecipePredictionOutputSchema);

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
  } else {
    // Poll cache for updates to
    unstable_cache(async () => {}, ["recipe", slug, "data"]);
  }

  return new StreamingTextResponse(readable);
}
