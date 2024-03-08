import { Separator } from "@/components/display/separator";
import { getSession } from "@/lib/auth/session";
import { getHotRecipes } from "../../db/queries";
import AdCard from "../ad/components";
import { RecipeListItem } from "../recipe/components";

export default async function Page() {
  const session = await getSession();
  const userId = session?.user.id;
  const recipes = (await getHotRecipes(session?.user.id)).map((recipe) => ({
    type: "recipe" as const,
    recipe,
  }));
  // Calculate the total number of ads needed
  const totalAds = Math.floor(recipes.length / 5);
  let items = [];

  for (let i = 0, adCount = 0; i < recipes.length; i++) {
    items.push(recipes[i]);
    // Insert an ad after every 5th recipe, but not if it's the last element
    if ((i + 1) % 5 === 0 && adCount < totalAds) {
      items.push({ type: "ad" } as const);
      adCount++;
    }
  }

  return (
    <div className="flex flex-col sm:gap-10 mt-0 sm:mt-10">
      {items.map((item, index) => {
        // ts hack, fix later
        if (!item) {
          return;
        }
        if (item.type === "recipe") {
          return (
            <RecipeListItem
              key={index}
              index={index}
              recipe={item.recipe}
              userId={userId}
            />
          );
        } else if (item.type === "ad") {
          return (
            <>
              <div className="px-4">
                <AdCard key={index} />
              </div>
              <Separator className="block md:hidden" />
            </>
          );
        }
      })}
    </div>
  );
}
