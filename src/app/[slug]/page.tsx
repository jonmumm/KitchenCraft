import { Card } from "@/components/display/card";
import { Separator } from "@/components/display/separator";
import { Button } from "@/components/input/button";
import { getRecentRecipeSlugs } from "@/lib/db";
import { assert } from "@/lib/utils";
import { ProfileSlugSchema } from "@/schema";
import { RecipeSlug } from "@/types";
import { kv } from "@vercel/kv";
import {
  ArrowBigUpIcon,
  ChefHatIcon,
  ChevronRightIcon,
  ScrollTextIcon,
} from "lucide-react";
import Link from "next/link";
import { getRecipe } from "../../db/queries/queries";
import { Header } from "../header";

export default async function Page(props: { params: { slug: string } }) {
  const slug = decodeURIComponent(props.params.slug);

  const profileParse = ProfileSlugSchema.safeParse(slug);
  if (profileParse.success) {
    const username = profileParse.data;
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center">
        <Header />

        <div className="px-4 w-full flex flex-col gap-4">
          <Card className="py-3 w-full">
            <div className="flex flex-col gap-2">
              <div className="flex flex-row gap-1 items-center px-2">
                <div className="px-4">
                  <ChefHatIcon />
                </div>
                <div className="flex flex-col gap-1">
                  <h1 className="underline font-bold text-xl">{username}</h1>
                  <span className="font-medium text-sm">(+123 🧪)</span>
                </div>
              </div>
              <Separator />
            </div>
          </Card>
          {/* <RecentCard /> */}
        </div>
      </div>
    );
  }

  return <div>Not Found</div>;

  // switch (true) {
  //   case slug.startsWith("@"):
  //     const chefSlug = slug;
  //     return
  // }
  // const supabase = createClient(cookies());
}

async function RecentCard() {
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
  const recipe = await getRecipe(props.slug);
  assert(recipe, "expected recipe");

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
