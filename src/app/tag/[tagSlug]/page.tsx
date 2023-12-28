import { RecipeListItem } from "@/app/recipe/components";
import { Separator } from "@/components/display/separator";
import { TagsCarousel } from "@/components/modules/tags-carousel";
import { getRecipesByTag } from "@/db/queries";
import { slugToSentence } from "@/lib/utils";

export default async function Page(props: { params: { tagSlug: string } }) {
  const tag = slugToSentence(props.params.tagSlug);
  const recipes = await getRecipesByTag(tag);

  return (
    <div className="flex flex-col">
      <Separator />
      <TagsCarousel currentTag={slugToSentence(tag)} />
      <Separator />
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
