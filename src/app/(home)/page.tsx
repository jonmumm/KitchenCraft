import {
  Card,
  CardContent,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from "@/components/display/card";
import { Button } from "@/components/input/button";
import { getSession } from "@/lib/auth/session";
import { RefreshCwIcon } from "lucide-react";
import { getHotRecipes } from "../../db/queries";
import { FeedCards } from "@/components/feed-cards";

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
      <div className="px-4 mt-8 max-w-3xl w-full mx-auto">
        <h3 className="text-lg font-medium">
          Today&apos;s Cookbook
          <span className="text-muted-foreground text-sm ml-2">May 30</span>
        </h3>
        {/* <Button variant="ghost">
          <span>Refresh Recommendations</span>
          <RefreshCwIcon className="ml-2" size={16} />
        </Button> */}
      </div>
      <div>
        <FeedCards />
      </div>
    </div>
  );
}
