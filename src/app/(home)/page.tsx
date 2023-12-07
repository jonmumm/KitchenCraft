import { getSession } from "@/lib/auth/session";
import {
  getHotRecipes,
  getUpvoteStatusForMultipleRecipes,
} from "../../db/queries";
import { RecipeListItem } from "../recipe/components";

// export const dynamic = "force-dynamic";
export default async function Page() {
  const items = new Array(30).fill(0);
  const session = await getSession();
  const userId = session?.user.id;
  const recipes = await getHotRecipes(session?.user.id);
  const slugs = recipes.map(({ slug }) => slug);

  const upvoteStatusBySlug =
    slugs.length && userId
      ? await getUpvoteStatusForMultipleRecipes(
          recipes.map(({ slug }) => slug),
          userId
        )
      : {};

  return (
    <div className="flex flex-col gap-10 mt-0 sm:mt-10">
      {items.map((_, index) => {
        const recipe = recipes[index];

        if (!recipe) {
          return null;
        }

        return (
          <RecipeListItem
            key={index}
            index={index}
            recipe={recipe}
            userId={userId}
            upvoted={upvoteStatusBySlug[recipe.slug]}
          />
        );
      })}
    </div>
  );
}
