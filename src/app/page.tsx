import { Button } from "@/components/ui/button";
import { RecipeSchema, SlugSchema } from "@/schema";
import Link from "next/link";
import { Recipe } from "@/types";
import { kv } from "@vercel/kv";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { RecentRecipes } from "@/components/recent-recipes";

export default async function Home() {
  // const recipeSlugs = await kv.zrange(`recipes:new`, 0, -1);

  // let newRecipes: Recipe[] = [];
  // if (recipeSlugs.length > 0) {
  //   const multi = kv.multi();
  //   recipeSlugs.forEach((slug) => {
  //     multi.hgetall(`recipe:${slug}`);
  //   });
  //   newRecipes = z.array(RecipeSchema).parse(await multi.exec());
  // }

  return (
    <div className="flex flex-col flex-end flex-1 justify- pt-16 overflow-hidden">
      <RecentRecipes />

      <Link href="/new" className="m-3 mb-16">
        <Button className="w-full">Creat New Recipe</Button>
      </Link>
    </div>
  );
}
