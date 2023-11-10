import { ingredientsParser, tagsParser } from "@/app/parsers";
import { getErrorMessage } from "@/lib/error";
import { StreamingTextResponse, writeChunk } from "@/lib/streams";
import { TokenParser } from "@/lib/token-parser";
import { getObjectHash, noop } from "@/lib/utils";
import { SuggestionPredictionOutputSchema } from "@/schema";
import { kv } from "@vercel/kv";
import { parseAsString } from "next-usequerystate";
import { NextRequest } from "next/server";
import { SuggestionTokenStream } from "./stream";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const params = new URLSearchParams(req.url.split("?")[1]);
  const prompt = parseAsString.parseServerSide(
    params.get("prompt") || undefined
  );
  const ingredients = ingredientsParser.parseServerSide(
    params.get("ingredients") || undefined
  );
  const tags = tagsParser.parseServerSide(params.get("tags") || undefined);

  const input = {
    prompt: prompt || undefined,
    ingredients,
    tags,
  };

  const resultId = getObjectHash(input);
  const resultKey = `result:${resultId}`;
  kv.hset(resultKey, { input, type: "suggestion", status: "running" }).then(
    noop
  );

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const tokenStream = new SuggestionTokenStream();
  const stream = await tokenStream.getStream(input);
  const parser = new TokenParser(SuggestionPredictionOutputSchema);
  const charArray: string[] = [];

  const process = async (stream: AsyncIterable<string>) => {
    for await (const chunk of stream) {
      for (const char of chunk) {
        charArray.push(char);
      }
      await writeChunk(writer, chunk);
      const outputRaw = charArray.join("");
      const output = parser.parsePartial(outputRaw);

      // only write the output if it's parseable
      if (output) {
        kv.hset(resultKey, { outputRaw }).then(noop);
      }
    }

    const outputRaw = charArray.join("");
    kv.hset(resultKey, { outputRaw }).then(noop);

    try {
      parser.parse(outputRaw);
      kv.hset(resultKey, { status: "done", outputRaw });
    } catch (ex) {
      kv.hset(resultKey, { status: "error", error: getErrorMessage(ex) });
    }
    writer.close();
  };

  writeChunk(writer, resultId).then(noop);
  process(stream);

  return new StreamingTextResponse(readable);
}
