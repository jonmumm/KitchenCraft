import { Label } from "@/components/ui/label";
import { getRecentRecipeSlugs, getRecipe } from "@/lib/db";
import { RecipeSlug } from "@/types";
import { kv } from "@vercel/kv";
import Link from "next/link";
import { Card } from "./ui/card";
import { ArrowBigUpIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Suspense } from "react";
import { Skeleton } from "./ui/skeleton";
import { z } from "zod";

export async function RecentRecipes() {
  const slugs = await getRecentRecipeSlugs(kv);

  return (
    <div className="p-4">
      <Label className="text-xs uppercase font-semibold">New Recipes</Label>
      <ul className="flex flex-col gap-2 mt-1">
        {new Array(30).fill(0).map((_, index) =>
          slugs[index] ? (
            <RecipeLink key={index} index={index} slug={slugs[index]} />
          ) : (
            <Card key={index}>
              <Skeleton className="w-full h-20" />
            </Card>
          )
        )}
      </ul>
    </div>
  );
}

function RecipeLink(props: { slug: RecipeSlug; index: number }) {
  return (
    <li className="flex flex-row flex-1 gap-1">
      <div className="flex flex-col gap-1 items-center justify-between">
        <Link href={`/recipe/${props.slug}`}>
          <Button variant="ghost" className="w-16 h-12 font-bold text-lg">
            {props.index + 1}.
          </Button>
        </Link>
        <Button variant="outline" className="w-16 h-12 flex flex-row gap-1">
          <ArrowBigUpIcon />
          <span>1</span>
        </Button>
      </div>
      <Link className="w-full block flex-1" href={`/recipe/${props.slug}`}>
        <Card className="flex flex-row h-full gap-2 px-3 py-2 items-center justify-between">
          <div className="h-full flex flex-col gap-1">
            <h2 className="font-medium">
              <Suspense fallback={<RecipeNamePlaceholder />}>
                <RecentRecipeName slug={props.slug} />
              </Suspense>
            </h2>
            <Suspense fallback={<RecipeDescriptionPlaceholder />}>
              <RecentRecipeDescription slug={props.slug} />
            </Suspense>
            <p className="text-sm text-muted-foreground">3 hours ago</p>
          </div>
          <ChevronRightIcon />
        </Card>
      </Link>
    </li>
  );
}

const RecipeNamePlaceholder = () => {
  return <Skeleton className="w-14 h-6" />;
};

export const RecentRecipeName = async ({ slug }: { slug: string }) => {
  const name = await kv.hget(`recipe:${slug}`, "name");
  return <>{name}</>;
};

const RecipeDescriptionPlaceholder = () => {
  return <Skeleton className="w-full h-14" />;
};

export const RecentRecipeDescription = async ({ slug }: { slug: string }) => {
  const description = z
    .string()
    .parse(await kv.hget(`recipe:${slug}`, "description"));
  return <p className="text-sm text-secondary-foreground">{description}</p>;
};
