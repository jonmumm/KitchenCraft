import { Header } from "@/app/header";
import { RecipeListItem } from "@/app/recipe/components";
import { Card } from "@/components/display/card";
import { getRecipesByTag } from "@/db/queries";
import { slugToSentence } from "@/lib/utils";
import { TagIcon } from "lucide-react";

export default async function Page(props: { params: { tagSlug: string } }) {
  const tag = slugToSentence(props.params.tagSlug);
  const recipes = await getRecipesByTag(tag);

  return (
    <div className="flex flex-col">
      <div className="w-full max-w-2xl mx-auto p-4">
        <Card className="py-2">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-1 items-center px-2">
              <div className="px-4">
                <TagIcon />
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="underline font-bold text-xl">{tag}</h1>
              </div>
            </div>
          </div>
        </Card>
      </div>
      <div className="w-full flex flex-col gap-4">
        {recipes.length ? (
          <div className="flex flex-col gap-12">
            {recipes.map((recipe, index) => (
              <RecipeListItem key={recipe.slug} index={index} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div>
            No recipes found for <span className="italics">${tag}</span>
          </div>
        )}
      </div>
    </div>
  );
}
