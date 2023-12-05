import { getSession } from "@/lib/auth/session";
import { getHotRecipes } from "../../db/queries";
import { RecipeListItem } from "../recipe/components";

// export const dynamic = "force-dynamic";
export default async function Page() {
  const items = new Array(30).fill(0);
  const session = await getSession();
  const userId = session?.user.id;
  const recipes = await getHotRecipes(session?.user.id);

  return (
    <div className="flex flex-col gap-12">
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
