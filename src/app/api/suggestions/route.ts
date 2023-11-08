import { ingredientsParser, tagsParser } from "@/app/parsers";
import { getErrorMessage } from "@/lib/error";
import { writeChunk } from "@/lib/streams";
import { TokenParser } from "@/lib/token-parser";
import { TokenStream } from "@/lib/token-stream";
import { getObjectHash, noop } from "@/lib/utils";
import { SuggestionPredictionOutputSchema } from "@/schema";
import { SuggestionPredictionInput } from "@/types";
import { kv } from "@vercel/kv";
import { NextRequest } from "next/server";
import { z } from "zod";
import { SuggestionTokenStream } from "./stream";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const params = new URLSearchParams(req.url.split("?")[1]);
  const prompt = z.string().min(1).parse(params.get("prompt"));
  const ingredients = ingredientsParser.parseServerSide(
    params.get("ingredients") || undefined
  );
  const tags = tagsParser.parseServerSide(params.get("tags") || undefined);

  const input = {
    prompt,
    ingredients: ingredients.join(", "),
    tags: tags.join(", "),
  };
  const resultId = getObjectHash(input);
  const resultKey = `result:${resultId}`;

  const tokenStream = new SuggestionTokenStream();
  const stream = await tokenStream.getStream({
    prompt,
    ingredients: ingredients.join(", "),
    tags: tags.join(", "),
  });

  const { readable, writable } = new TransformStream();

  const writer = writable.getWriter();

  kv.hset(resultKey, { input, type: "suggestion", status: "running" }).then(
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
  };

  writeChunk(writer, resultId).then(noop);
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
