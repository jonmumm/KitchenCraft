import { RecipeListItem } from "@/app/recipe/components";
import { getBestRecipes } from "@/db/queries";
import { getSession } from "@/lib/auth/session";
import { TimeParamSchema } from "../schema";

// export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const timeParam = TimeParamSchema.parse(searchParams["t"] || "month");

  const items = new Array(30).fill(0);
  const session = await getSession();
  const userId = session?.user.id;
  const recipes = await getBestRecipes(timeParam);

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
