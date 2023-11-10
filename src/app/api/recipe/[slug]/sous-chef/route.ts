import { StreamingTextResponse, writeChunk } from "@/lib/streams";
import { getObjectHash, noop } from "@/lib/utils";
import { CompletedRecipeSchema } from "@/schema";
import { SousChefPredictionInput } from "@/types";
import { kv } from "@vercel/kv";
import { z } from "zod";
import { SousChefTokenStream } from "./stream";

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const searchParams = new URLSearchParams(req.url.split("?")[1]);

  const prompt = z.string().min(1).parse(searchParams.get("prompt"));

  const recipeKey = `recipe:${params.slug}`;
  const recipe = CompletedRecipeSchema.parse(await kv.hgetall(recipeKey));

  const input = {
    recipe,
    prompt,
  } satisfies SousChefPredictionInput;

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

  const tokenStream = new SousChefTokenStream();
  const stream = await tokenStream.getStream(input);

  process(stream);

  return new StreamingTextResponse(readable);
}
