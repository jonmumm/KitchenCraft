import { RecipeListItem } from "@/app/recipe/components";
import { Badge } from "@/components/display/badge";
import { Card } from "@/components/display/card";
import { Separator } from "@/components/display/separator";
import { Button } from "@/components/input/button";
import { TagsCarousel } from "@/modules/tags-carousel";
import { getRecipesByTag } from "@/db/queries";
import { slugToSentence } from "@/lib/utils";
import { ChevronRightIcon } from "lucide-react";

export default async function Page(props: { params: { tagSlug: string } }) {
  const tag = slugToSentence(props.params.tagSlug);
  const recipes = await getRecipesByTag(tag);

  return (
    <div className="flex flex-col">
      <TagsCarousel currentTag={slugToSentence(tag)} />
      <Separator className="mb-8 sm:mb-12" />
      <div className="w-full flex flex-col gap-4">
        {recipes.length ? (
          <div className="flex flex-col gap-12">
            {recipes.map((recipe, index) => (
              <RecipeListItem key={recipe.slug} index={index} recipe={recipe} />
            ))}
          </div>
        ) : (
          <Card className="mx-4 p-4 flex flex-col justify-center items-center gap-4">
            <h1 className="font-semibold txt-lg">Oh no</h1>
            <div className="flex flex-row items-center gap-2 justify-center text-sm">
              No recipes found matching <Badge variant="outline">{tag}</Badge>
            </div>
            <Button event={{ type: "NEW_RECIPE" }} variant="secondary" className="flex flex-row gap-1 items-center">
              Create One <ChevronRightIcon />
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
