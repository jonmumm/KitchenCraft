import { getRecipe } from "@/db/queries";
import { StreamingTextResponse, writeChunk } from "@/lib/streams";
import { assert, getObjectHash, noop } from "@/lib/utils";
import { TipsAndTricksPredictionInput } from "@/types";
import { z } from "zod";
import { TipsAndTricksTokenStream } from "./stream";

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: { params: { slug: string } }
) {
  const recipe = await getRecipe(params.slug);
  assert(recipe, "expected recipe");
  // const recipe = CompletedRecipeSchema.parse(await kv.hgetall(recipeKey));

  const input = {
    recipe,
  } satisfies TipsAndTricksPredictionInput;

  const resultId = getObjectHash(input);
  //   const resultKey = `result:${resultId}`;

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const charArray: string[] = [];

  const process = async (stream: AsyncIterable<string>) => {
    for await (const chunk of stream) {
      for (const char of chunk) {
        charArray.push(char);
      }
      await writeChunk(writer, chunk);
      //   const outputRaw = charArray.join("");
    }

    // todo how i do i stop the stream here?
    writer.close();
    // const outputRaw = charArray.join("");
  };

  writeChunk(writer, resultId).then(noop);

  const tokenStream = new TipsAndTricksTokenStream({
    cacheKey: `tips-and-tricks:${params.slug}`,
  });
  const stream = await tokenStream.getStream(input);

  process(stream);

  return new StreamingTextResponse(readable);
}
