"use client";

import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { cn } from "@/lib/utils";
import {
  createFeedItemAtIndexSelector,
  createFeedItemRecipeAtIndexSelector,
  selectNumFeedItemIds,
} from "@/selectors/page-session.selectors";
import { CheckIcon } from "lucide-react";
import { ReactNode, useMemo } from "react";
import { Badge } from "./display/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./display/card";
import { SkeletonSentence } from "./display/skeleton";

const FeedCardItem = ({ index }: { index: number }) => {
  const selectFeedItem = useMemo(
    () => createFeedItemAtIndexSelector(index),
    [index]
  );
  const feedItem = usePageSessionSelector(selectFeedItem);

  const recipeItems = new Array(
    Math.max(feedItem?.recipes?.length || 0, 3)
  ).fill(0);

  return (
    <Card
      className={cn("max-w-3xl w-full mx-auto border-solid border-t-4")}
      style={{ borderTopColor: feedItem?.color ? `${feedItem.color}` : `` }}
    >
      <CardHeader>
        <CardTitle className="text-lg">
          {feedItem?.category ? (
            <>{feedItem.category}</>
          ) : (
            <SkeletonSentence className="h-7" numWords={3} />
          )}
        </CardTitle>
        <div>
          {feedItem?.category ? (
            <CardDescription>{feedItem.description}</CardDescription>
          ) : (
            <SkeletonSentence className="h-5" numWords={7} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <FeedCardRecipeCarousel>
          {recipeItems.map((_, recipeIndex) => {
            return (
              <FeedCardRecipeItem
                key={recipeIndex}
                recipeIndex={recipeIndex}
                itemIndex={index}
              />
            );
          })}
        </FeedCardRecipeCarousel>
      </CardContent>
    </Card>
  );
};

const FeedCardRecipeCarousel = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative h-24 ">
      <div className="absolute top-0 w-screen left-1/2 transform -translate-x-1/2 z-10 flex flex-row justify-center">
        <div className="carousel carousel-center pl-2 pr-8 space-x-2">
          {children}
        </div>
      </div>
    </div>
  );
};

const FeedCardRecipeItem = (input: {
  recipeIndex: number;
  itemIndex: number;
}) => {
  const selectFeedRecipe = useMemo(
    () => createFeedItemRecipeAtIndexSelector(input),
    [input]
  );
  const recipe = usePageSessionSelector(selectFeedRecipe);

  return (
    <Card className="carousel-item w-72 h-24 flex flex-row gap-2 justify-center items-center px-4">
      <div className="flex flex-col gap-2 flex-1">
        <CardTitle className="text-md">
          {recipe?.name ? (
            <>{recipe.name}</>
          ) : (
            <SkeletonSentence numWords={3} className="h-5" />
          )}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {recipe?.tagline}
        </CardDescription>
      </div>
      <div>
        {recipe?.name && recipe?.tagline ? (
          <Badge
            variant="secondary"
            event={{
              type: "SELECT_RECIPE_SUGGESTION",
              name: recipe.name,
              tagline: recipe.tagline,
            }}
          >
            Select <CheckIcon className="ml-1" size={14} />
          </Badge>
        ) : (
          <Badge variant="secondary" className="opacity-40">
            Select <CheckIcon className="ml-1" size={14} />
          </Badge>
        )}
      </div>
    </Card>
  );
};

export const FeedCards = () => {
  const numFeedItemIds = usePageSessionSelector(selectNumFeedItemIds);
  const items = new Array(Math.max(numFeedItemIds, 3)).fill(0);

  return (
    <div className="m-4 flex flex-col gap-8">
      {items.map((_, index) => {
        return <FeedCardItem key={index} index={index} />;
      })}
    </div>
  );
};
