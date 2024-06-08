import { FeedCards } from "@/components/feed-cards";
import { getSession } from "@/lib/auth/session";
import { getTimezone } from "@/lib/headers";
import { getHotRecipes } from "../../db/queries";
import { RefreshFeedButton } from "./refresh-feed-button";

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const session = await getSession();
  const recipes = (await getHotRecipes(session?.user.id)).map((recipe) => ({
    type: "recipe" as const,
    recipe,
  }));
  // Calculate the total number of ads needed
  const totalAds = Math.floor(recipes.length / 5);
  let items = [];
  // const adInstanceIds = [];

  const timezone = getTimezone();
  const date = new Date();
  const today = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: timezone,
  });

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

  return (
    <div className="flex flex-col sm:gap-10 mt-0 sm:mt-10">
      <div className="px-4 mt-8 max-w-3xl w-full mx-auto flex flex-row justify-between items-center">
        <h3 className="text-lg font-medium">
          Today&apos;s Cookbook
          <span className="text-muted-foreground text-sm ml-2">{today}</span>
        </h3>
        {/* <RefreshFeedButton /> */}
      </div>
      <div>
        <FeedCards />
      </div>
    </div>
  );
}
