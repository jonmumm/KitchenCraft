import { Avatar, AvatarFallback } from "@/components/display/avatar";
import { Badge } from "@/components/display/badge";
import { Card } from "@/components/display/card";
import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import { AsyncRenderFirstValue } from "@/components/util/async-render-first-value";
import { AsyncRenderLastValue } from "@/components/util/async-render-last-value";
import {
  getProfileBySlug,
  getProfileLifetimePoints,
  getRecentRecipesByProfile,
} from "@/db/queries";
import { formatJoinDateStr } from "@/lib/utils";
import { ProfileSlugSchema } from "@/schema";
import { ChefHatIcon } from "lucide-react";
import Link from "next/link";
import { from, shareReplay } from "rxjs";
import { Header } from "../header";
import { RecipeListItem } from "../recipe/components";

const NUM_PLACEHOLDER_RECIPES = 30;

export default async function Page(props: { params: { slug: string } }) {
  const slug = decodeURIComponent(props.params.slug);
  const profileParse = ProfileSlugSchema.safeParse(slug);
  if (!profileParse.success) {
    return <>Error parsing URL for slug</>;
  }
  const username = profileParse.data.slice(1);

  const [recipes$, profile$, points$] = [
    from(getRecentRecipesByProfile(username)).pipe(shareReplay(1)),
    from(getProfileBySlug(username)).pipe(shareReplay(1)),
    from(getProfileLifetimePoints(username)).pipe(shareReplay(1)),
  ];

  // const recipesByIndex$ = new Array(NUM_PLACEHOLDER_RECIPES)
  //   .fill(0)
  //   .map((_, index) => {
  //     console.log(index);
  //     return recipes$.pipe(
  //       tap(console.log),
  //       filter((items) => !!items[index]),
  //       map((items) => items[index]),
  //       filter(notUndefined),
  //       take(1)
  //     );
  //   });

  const Username = () => {
    return (
      <AsyncRenderFirstValue
        observable={profile$}
        render={(profile) => <>{profile?.profileSlug}</>}
        fallback={<Skeleton className="w-full h-4" />}
      />
    );
  };

  const Points = () => {
    return (
      <AsyncRenderFirstValue
        observable={points$}
        render={(points) => <>{points}</>}
        fallback={<Skeleton className="w-full h-4" />}
      />
    );
  };

  const JoinDate = () => {
    return (
      <AsyncRenderFirstValue
        observable={profile$}
        render={(profile) => <>{formatJoinDateStr(profile?.createdAt!)}</>}
        fallback={<Skeleton className="w-full h-4" />}
      />
    );
  };

  return (
    <div className="flex flex-col">
      <div className="max-w-2xl w-full mx-auto">
        <Header />
      </div>

      <div className="w-full max-w-2xl mx-auto p-4 gap-2 flex flex-col mb-8">
        <Card className="py-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-4 items-center px-4">
              <Avatar>
                {/* <AvatarImage src="https://github.com/shadcn.png" /> */}
                <AvatarFallback>
                  <ChefHatIcon />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1 flex-1">
                <h1 className="underline font-bold text-xl">
                  <Username />
                </h1>
                <div className="flex flex-row justify-between">
                  <span className="font-medium text-sm">
                    +<Points /> 🧪
                  </span>
                  <Badge variant="outline">
                    <JoinDate />
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>
        <AsyncRenderFirstValue
          observable={profile$}
          render={(profile) => {
            return (
              !profile?.activated && (
                <Card className="text-primary text-sm flex flex-row gap-2 justify-between items-center py-2 px-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="flex-1 text-sm text-muted-foreground font-semibold">
                      Not Active
                    </h3>
                    <p className="text-xs flex-1">
                      Chef pages are available for Chef&apos;s Club members
                    </p>
                  </div>
                  <Link href="/chefs-club">
                    <Button className="whitespace-nowrap">
                      Join Chef&apos;s Club
                    </Button>
                  </Link>
                </Card>
              )
            );
          }}
          fallback={<Skeleton />}
        />
      </div>
      <div className="w-full flex flex-col gap-4">
        {/* Display the recipes using RecipeListItem */}
        <div className="flex flex-col gap-12">
          {new Array(NUM_PLACEHOLDER_RECIPES).fill(0).map((_, index) => (
            <AsyncRenderLastValue
              key={index}
              fallback={null}
              observable={
                recipes$
                // recipesByIndex$[index]?.pipe(defaultIfEmpty(undefined))!
              }
              render={(recipes) => {
                const recipe = recipes[index];
                return recipe ? (
                  <RecipeListItem recipe={recipe} index={index} />
                ) : (
                  <></>
                );
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
