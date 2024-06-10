import { Card } from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import { TabsContent } from "@/components/navigation/tabs";
import quoteList from "@/data/quotes.json";
import { ChevronRightIcon, Loader2Icon, TimerIcon } from "lucide-react";
import Image from "next/image";
import { ReactNode, Suspense } from "react";
// import {
//   RecipeDescription,
//   RecipeLink,
//   RecipeName,
//   RecipeTimestamp,
// } from "./components";
import { Badge } from "@/components/display/badge";
import { EventButton } from "@/components/event-button";
import NavigationLink from "@/components/navigation/navigation-link";
import { db } from "@/db";
import { getNextAuthSession } from "@/lib/auth/session";
import { formatDuration, shuffle, timeAgo } from "@/lib/utils";
import {
  getProfileByUserId,
  getRecentLikedRecipesByUser,
  getSortedMediaForMultipleRecipes,
} from "../../db/queries";
import LayoutClient, { HomeTabs } from "./layout.client";
// import { db } from "@vercel/postgres";

export default async function Layout({ children }: { children: ReactNode }) {
  const userId = (await getNextAuthSession())?.user.id;
  let username: string | undefined;
  if (userId) {
    const result = await getProfileByUserId(userId);
    username = result?.profileSlug;
  }

  return (
    <LayoutClient>
      <div className="flex flex-col">
        {/* {userId && (
          <div className="flex flex-col gap-1 w-full mb-2">
            <div className="flex flex-row justify-between items-end px-4 pb-1 w-full max-w-2xl mx-auto">
              <Label className="uppercase font-semibold text-accent-foreground opacity-70 text-xs">
                {username}&apos;s Crafts
              </Label>
              <NavigationLink
                href={username ? `/@${username}` : `/my-cookbook`}
              >
                <Badge variant="outline">
                  View All <span className="transitioning:hidden ml-1">⇨</span>
                  <Loader2Icon
                    size={14}
                    className="animate-spin transitioning:inline-block hidden ml-1"
                  />
                </Badge>
              </NavigationLink>
            </div>
            <MyRecipes userId={userId} />
          </div>
        )} */}
        <HomeTabs>
          {/* <TabsList className="w-full">
            <TabsTrigger value="hot" asChild>
              <NavigationLink href="/">
                Hot
                <Loader2Icon
                  size={14}
                  className="animate-spin hidden transitioning:inline-block ml-1"
                />
              </NavigationLink>
            </TabsTrigger>
            <TabsTrigger value="recent" asChild>
              <NavigationLink href="/recent">
                Recent
                <Loader2Icon
                  size={14}
                  className="animate-spin hidden transitioning:inline-block ml-1"
                />
              </NavigationLink>
            </TabsTrigger>
            <TabsTrigger value="best" asChild>
              <NavigationLink href="/best" className="flex flex-row gap-2">
                <span>Best</span>
                <Loader2Icon
                  size={14}
                  className="animate-spin hidden transitioning:inline-block ml-1"
                />
                <BestDropdown />
              </NavigationLink>
            </TabsTrigger>
          </TabsList> */}
          {/* <TagsCarousel currentTag={"All"} /> */}
          {/* <Separator className="mb-8" /> */}
          <TabsContent value="hot">{children}</TabsContent>
          <TabsContent value="recent">{children}</TabsContent>
          <TabsContent value="best">{children}</TabsContent>
        </HomeTabs>
      </div>
    </LayoutClient>
  );
}

const MyRecipes = ({ userId }: { userId: string }) => {
  const items = new Array(20).fill(0);
  const Loader = () => {
    return (
      <>
        {items.map((_, index) => {
          return <Skeleton key={index} className="w-64 h-36 carousel-item" />;
        })}
      </>
    );
  };

  const RecipeList = async () => {
    const recipes = await getRecentLikedRecipesByUser(db, userId);
    const slugs = recipes.map((recipe) => recipe.slug);
    const quotes = shuffle(quoteList);
    const mediaBySlug = slugs.length
      ? await getSortedMediaForMultipleRecipes(slugs)
      : {};

    return (
      <>
        {items.map((_, index) => {
          const recipe = recipes[index];
          const quote = quotes[index]?.quote;
          if (!recipe) {
            return (
              quote && (
                <EventButton
                  key={index}
                  event={{ type: "NEW_RECIPE" }}
                  className="p-0"
                >
                  <Card
                    key={index}
                    className="w-64 h-36 carousel-item bg-muted rounded-lg flex flex-col gap-2 items-start justify-between text-xs p-3 box-border"
                  >
                    <p className="text-left">{quotes[index]?.quote}</p>
                    <div className="flex flex-row justify-between w-full flex-shrink-0 items-center text-xs">
                      <span>— {quotes[index]?.author}</span>
                      <Badge
                        variant="outline"
                        className="flex flex-row gap-1 flex-shrink-0"
                      >
                        <span>Craft New</span>
                        <span>
                          <ChevronRightIcon />
                        </span>
                      </Badge>
                    </div>
                  </Card>
                </EventButton>
              )
            );
          }
          const media = mediaBySlug[recipe.slug]?.[0];

          return (
            <div key={index} className="carousel-item w-64 h-36">
              <NavigationLink key={recipe.slug} href={`/recipe/${recipe.slug}`}>
                <Card className="w-64 h-36 bg-secondary flex flex-col gap-1 justify-between py-2">
                  <div className="flex flex-row gap-2 px-3 items-start">
                    <h3 className="text-lg font-semibold flex-1 line-clamp-2">
                      {recipe.name}
                    </h3>
                    {!media ? (
                      <Button size="icon" variant="outline">
                        <ChevronRightIcon className="transitioning:hidden" />
                        <Loader2Icon className="transitioning:block hidden animate-spin" />
                      </Button>
                    ) : (
                      <>
                        <Image
                          priority={index === 0}
                          className="w-16 aspect-square rounded-sm"
                          // layoutId={`${item.id}-${index}`}
                          sizes="(max-width: 768px) 20vw, (max-width: 1200px) 15vw, 10vw"
                          src={media.url}
                          width={media.width}
                          height={media.height}
                          alt={recipe.name}
                          style={{ objectFit: "cover" }}
                        />
                      </>
                    )}
                  </div>
                  <div className="line-clamp-2 text-xs text-muted-foreground leading-5 px-3">
                    {recipe.description}
                  </div>
                  <div className="flex flex-row justify-between px-3 items-end">
                    <div className="text-xs text-muted-foreground flex flex-row gap-1">
                      <TimerIcon size={14} />
                      <span>{formatDuration(recipe.totalTime)}</span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {timeAgo(recipe.createdAt.toISOString())}
                    </div>
                  </div>
                </Card>
              </NavigationLink>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="carousel carousel-center space-x-2 px-4">
      <Suspense fallback={<Loader />}>
        <RecipeList />
      </Suspense>
    </div>
  );
};
