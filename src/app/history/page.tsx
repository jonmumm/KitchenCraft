import { Avatar, AvatarFallback } from "@/components/display/avatar";
import { Badge } from "@/components/display/badge";
import { Card } from "@/components/display/card";
import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import { AsyncRenderFirstValue } from "@/components/util/async-render-first-value";
import { AsyncRenderLastValue } from "@/components/util/async-render-last-value";
import { getProfileLifetimePoints, getRecentLikedRecipesByUser } from "@/db/queries";
import { formatJoinDateStr } from "@/lib/utils";
import { ChefHatIcon } from "lucide-react";
import { RecipeListItem } from "../recipe/components";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";
import { combineLatest, from, map, of, shareReplay } from "rxjs";
import { redirect } from "next/navigation";
import { Progress } from "@/components/feedback/progress";
import { Label } from "@/components/display/label";
import { Separator } from "@/components/display/separator";
import { db } from "@/db";

const NUM_PLACEHOLDER_RECIPES = 30;

export default async function Page() {
  const session = await getSession();
  if (!session) {
    redirect("/auth/signin");
  }
  const userId = session.user.id;
  const recipes$ = from(getRecentLikedRecipesByUser(db, userId)).pipe(shareReplay(1));

  // Rest of your existing components like Username, Points, ClaimDate etc.
  const quotaLimit$ = of(3);
  const usage$ = of(1);

  return (
    <div className="flex flex-col">
      <div className="max-w-2xl mx-auto w-full px-4">
        <Card className="w-full mb-8">
          <div className="p-6 flex flex-col gap-3">
            <div className="flex flex-row justify-between">
              <Label>Recipe Quota</Label>
              <AsyncRenderFirstValue
                observable={combineLatest([quotaLimit$, usage$])}
                render={([limit, usage]) => {
                  return (
                    <div className="text-sm uppercase">
                      {usage}/{limit}
                    </div>
                  );
                }}
                fallback={<Progress value={0} />}
              />
            </div>
            <AsyncRenderFirstValue
              observable={combineLatest([quotaLimit$, usage$])}
              render={([limit, usage]) => {
                return <Progress value={(100 * usage) / limit} />;
              }}
              fallback={<Progress value={0} />}
            />
          </div>
        </Card>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 mb-2">
        <Label>History</Label>
      </div>

      <div className="w-full flex flex-col gap-4">
        {/* Display the recipes using RecipeListItem */}
        <div className="flex flex-col gap-12 max-w-2xl w-full mx-auto px-4">
          {new Array(NUM_PLACEHOLDER_RECIPES).fill(0).map((_, index) => (
            <AsyncRenderLastValue
              key={index}
              fallback={<Skeleton animation={"none"} className="w-full h-24" />}
              observable={recipes$}
              render={(recipes) => {
                const recipe = recipes[index];
                return recipe ? (
                  <RecipeListItem recipe={recipe} index={index} />
                ) : (
                  <Skeleton animation={"none"} className="w-full h-24" />
                );
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
