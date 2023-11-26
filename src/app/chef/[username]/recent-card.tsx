import { Label } from "@/components/display/label";
import { getRecentRecipeSlugs, getRecipe } from "@/lib/db";
import { RecipeSlug } from "@/types";
import { kv } from "@vercel/kv";
import Link from "next/link";
import { Card } from "@/components/display/card";
import { ArrowBigUpIcon, ChevronRightIcon, ScrollTextIcon } from "lucide-react";
import { Button } from "@/components/input/button";
import { Separator } from "@/components/display/separator";

export async function RecentCard() {
  const recipeSlugs = await getRecentRecipeSlugs(kv);
  return (
    <Card className="w-full">
      <div className="px-4 flex flex-row justify-between gap-1 items-center py-4">
        <h3 className="uppercase text-xs font-bold text-accent-foreground">
          Recent Crafts
        </h3>
        <ScrollTextIcon />
      </div>
      <Separator />
      <div className="p-4">
        <ul className="flex flex-col gap-2 mt-1">
          {recipeSlugs.map((slug, index) => (
            <RecipeLink key={slug} index={index} slug={slug} />
          ))}
        </ul>
      </div>
    </Card>
  );
}

async function RecipeLink(props: { slug: RecipeSlug; index: number }) {
  const recipe = await getRecipe(kv, props.slug);
  return (
    <li className="flex flex-row flex-1 gap-1">
      <div className="flex flex-col gap-1 items-center justify-between">
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
