import { getErrorMessage } from "@/lib/error";
import { StreamingTextResponse, writeChunk } from "@/lib/streams";
import { TokenParser } from "@/lib/token-parser";
import { assert, noop } from "@/lib/utils";
import { InstantRecipeMetadataPredictionOutputSchema } from "@/schema";
import { kv } from "@/lib/kv";
import { nanoid } from "ai";
import { parseAsString } from "next-usequerystate";
import { NextRequest } from "next/server";
import { InstantRecipeMetadataStream } from "./stream";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const params = new URLSearchParams(req.url.split("?")[1]);
  const prompt = parseAsString.parseServerSide(
    params.get("prompt") || undefined
  );
  assert(prompt, "expected prompt");
  const input = {
    prompt,
  };

  const resultId = nanoid();

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const tokenStream = new InstantRecipeMetadataStream();
  const stream = await tokenStream.getStream(input);
  const parser = new TokenParser(InstantRecipeMetadataPredictionOutputSchema);
  const charArray: string[] = [];

  const process = async (stream: AsyncIterable<string>) => {
    for await (const chunk of stream) {
      for (const char of chunk) {
        charArray.push(char);
      }
      await writeChunk(writer, chunk);
    }

    const outputRaw = charArray.join("");
    // kv.hset(resultKey, { outputRaw }).then(noop);
    const resultKey = `instant-recipe:${resultId}`;

    try {
      const output = parser.parse(outputRaw);
      await kv.hset(resultKey, { status: "done", outputRaw, output });
    } catch (ex) {
      await kv.hset(resultKey, { status: "error", error: getErrorMessage(ex) });
    }
    writer.close();
  };

  writeChunk(writer, resultId).then(noop);
  process(stream);

  return new StreamingTextResponse(readable);
}
