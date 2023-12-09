import { RecipeListItem } from "@/app/recipe/components";
import { getRecentRecipes } from "@/db/queries";
import { getSession } from "@/lib/auth/session";

export default async function Page() {
  const items = new Array(30).fill(0);
  const session = await getSession();
  const userId = session?.user.id;
  const recipes = await getRecentRecipes();

  return (
    <div className="flex flex-col sm:gap-10 mt-0 sm:mt-10">
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
          />
        );
      })}
    </div>
  );
}
