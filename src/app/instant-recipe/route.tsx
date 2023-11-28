import { getSlug } from "@/lib/slug";
import { TokenParser } from "@/lib/token-parser";
import { assert } from "@/lib/utils";
import { InstantRecipeMetadataPredictionOutputSchema } from "@/schema";
import { nanoid } from "ai";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { z } from "zod";
import { createRecipe } from "../recipe/lib";
import { InstantRecipeMetadataStream } from "./streams";

export const maxDuration = 300;

async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const prompt = z.string().min(1).parse(searchParams.get("prompt"));
  const id = nanoid();
  let name = searchParams.get("name");
  let description = searchParams.get("description");

  if (!name || !description) {
    const tokenStream = new InstantRecipeMetadataStream();
    const stream = await tokenStream.getStream({ prompt });
    const parser = new TokenParser(InstantRecipeMetadataPredictionOutputSchema);
    const charArray: string[] = [];

    for await (const chunk of stream) {
      for (const char of chunk) {
        charArray.push(char);
      }
      // const outputRaw = charArray.join("");
      // const output = parser.parsePartial(outputRaw);

      // only write the output if it's parseable
      // if (output) {
      //   kv.hset(resultKey, { outputRaw }).then(noop);
      // }
    }

    const outputRaw = charArray.join("");
    try {
      const result = parser.parse(outputRaw);
      name = result.name;
      description = result.description;
      // kv.hset(resultKey, { status: "done", outputRaw });
    } catch (ex) {
      // kv.hset(resultKey, { status: "error", error: getErrorMessage(ex) });
      // failed to parse.
      console.error(ex);
      return redirect("/");
    }
    assert(name, "expected name");
    assert(description, "expected description");
  }

  const slug = getSlug({ id, name });
  await createRecipe({
    slug,
    name,
    description,
    createdAt: new Date().toISOString(),
    fromPrompt: prompt,
    runStatus: "initializing",
    previewMediaIds: [],
    mediaCount: 0,
  });

  return redirect(`/recipe/${slug}`);

  // return (
  //   <Generator
  //     onComplete={({ name, description }) => {
  //       const slug = getSlug({ id, name });
  //       const recipe = {
  //         slug,
  //         name,
  //         description,
  //         createdAt: new Date().toISOString(),
  //         fromPrompt: prompt,
  //         runStatus: "initializing",
  //         previewMediaIds: [],
  //         mediaCount: 0,
  //       } satisfies Recipe;

  //       kv.hset(`recipe:${slug}`, recipe).then(() => {
  //         redirect("/");
  //       });
  //     }}
  //     stream={stream}
  //     schema={z.object({
  //       name: z.string(),
  //       description: z.string(),
  //     })}
  //   />
  // );
}

export { GET };

const getNameAndDescription = async (prompt: string) => {
  return { name: "Foo", description: "Bar" };
};
