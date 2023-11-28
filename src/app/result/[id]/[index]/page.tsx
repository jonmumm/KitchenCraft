import { getResult } from "@/lib/db";
import { getSlug } from "@/lib/slug";
import { TokenParser } from "@/lib/token-parser";
import { outputSchemaByType } from "@/schema";
import { Recipe } from "@/types";
import { kv } from "@vercel/kv";
import { nanoid } from "ai";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

export const maxDuration = 300;

type Props = {
  params: { id: string; index: string };
};
export default async function Page(props: Props) {
  const { id, index } = props.params;

  return (
    <div className="flex flex-col gap-2 max-w-2xl mx-auto">
      <CreateRecipe resultId={id} index={z.number().parse(parseInt(index))} />
    </div>
  );
}

const CreateRecipe = async ({
  resultId,
  index,
}: {
  resultId: string;
  index: number;
}) => {
  const result = await getResult(kv, resultId);
  const schema = outputSchemaByType[result.type];
  const parser = new TokenParser(schema);
  const output = parser.parsePartial(result.outputRaw);

  if (!output?.suggestions) {
    return <>Suggestions not found</>;
  }

  const { name, description } = output.suggestions[index];
  if (!name || !description) {
    return <>Missing recipe info</>;
  }

  const id = nanoid();
  const slug = getSlug({ id, name });

  const recipe = {
    slug,
    name,
    description,
    createdAt: new Date().toISOString(),
    fromResult: {
      resultId,
      index,
    },
    runStatus: "initializing",
    previewMediaIds: [],
    mediaCount: 0,
    upvotes: 0,
  } satisfies Recipe;

  await kv.hset(`recipe:${slug}`, recipe);
  redirect(`/recipe/${slug}`);
};
