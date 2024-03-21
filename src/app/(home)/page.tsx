import { Separator } from "@/components/display/separator";
import { getSession } from "@/lib/auth/session";
import { getHotRecipes } from "../../db/queries";
import { AffiliateProductCarousel } from "../recipe/[slug]/products/components";
import { RecipeListItem } from "../recipe/components";

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const session = await getSession();
  const userId = session?.user.id;
  const recipes = (await getHotRecipes(session?.user.id)).map((recipe) => ({
    type: "recipe" as const,
    recipe,
  }));
  // Calculate the total number of ads needed
  const totalAds = Math.floor(recipes.length / 5);
  let items = [];
  // const adInstanceIds = [];

  for (let i = 0, adCount = 0; i < recipes.length; i++) {
    items.push(recipes[i]);
    // Insert an ad after every 5th recipe, but not if it's the last element
    if ((i + 1) % 5 === 0 && adCount < totalAds) {
      // const adInstanceId = randomUUID();
      // adInstanceIds.push(adInstanceId);
      items.push({ type: "ad" } as const);
      adCount++;
    }
  }

  // const sessionActorClient = await getSessionActorClient();
  // const uniqueId = await getUniqueId();
  // // todo: generate a session id instead of using the users unique id for the session id
  // sessionActorClient
  //   .send(uniqueId, {
  //     type: "INIT_AD_INSTANCES",
  //     ids: adInstanceIds,
  //     context: { type: "home_feed", category: "curated" },
  //   })
  //   .then(noop);

  return (
    <div className="flex flex-col sm:gap-10 mt-0 sm:mt-10">
      <div className="px-4 mt-8">
        <h3 className="text-muted-foreground uppercase text-xs">
          Recommended for you
        </h3>
      </div>
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
              <div className="relative h-96">
                <div className="absolute w-screen left-1/2 top-6 transform -translate-x-1/2 h-70 flex justify-center z-20">
                  {/* <AdCard key={item.id} adInstanceId={item.id} index={index} /> */}
                  <AffiliateProductCarousel
                  // slug={slug}
                  // productType={"equipment"}
                  />
                </div>
              </div>
              <Separator className="block md:hidden" />
            </>
          );
        }
      })}
    </div>
  );
}
