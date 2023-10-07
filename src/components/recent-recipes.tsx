import { Label } from "@/components/ui/label";
import { getRecentRecipeSlugs, getRecipe } from "@/lib/db";
import { RecipeSlug } from "@/types";
import { kv } from "@vercel/kv";
import Link from "next/link";
import { Card } from "./ui/card";
import { ArrowBigUpIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "./ui/button";

export async function RecentRecipes() {
  const recipeSlugs = await getRecentRecipeSlugs(kv);

  return (
    <div className="p-4">
      <Label className="text-xs uppercase font-semibold">Top Recipes</Label>
      <ul className="flex flex-col gap-2 mt-1">
        {recipeSlugs.map((slug, index) => (
          <RecipeLink key={slug} index={index} slug={slug} />
        ))}
      </ul>
    </div>
  );
}

async function RecipeLink(props: { slug: RecipeSlug; index: number }) {
  // const recipe = await kv.hgetall(`recipe:${props.slug}`);
  // console.log({ recipe });
  const recipe = await getRecipe(kv, props.slug);
  // console.log({ recipe });
  // return <>{props.slug}</>;
  // const recipe = await getRecipe(kv, props.slug);
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
            <h2 className="font-medium">{recipe.name}</h2>
            <p className="text-sm text-secondary-foreground">
              {recipe.description}
            </p>
            <p className="text-sm text-muted-foreground">3 hours ago</p>
          </div>
          <ChevronRightIcon />
        </Card>
      </Link>
    </li>
  );
}
