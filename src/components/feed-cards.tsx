"use client";

import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { cn } from "@/lib/utils";
import {
  createFeedItemAtIndexSelector,
  createFeedItemRecipeAtIndexIsSelectedSelector,
  createFeedItemRecipeAtIndexSelector,
  selectNumFeedItemIds,
} from "@/selectors/page-session.selectors";
import { CheckIcon, ExpandIcon } from "lucide-react";
import { ReactNode, useMemo } from "react";
import { Badge } from "./display/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./display/card";
import { Separator } from "./display/separator";
import { SkeletonSentence } from "./display/skeleton";
import EventTrigger from "./input/event-trigger";
import { Button } from "./ui/button";

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
    <div className="relative h-32 ">
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
  const selectIsSelected = useMemo(
    () => createFeedItemRecipeAtIndexIsSelectedSelector(input),
    [input]
  );
  const recipe = usePageSessionSelector(selectFeedRecipe);
  const isSelected = usePageSessionSelector(selectIsSelected);

  return (
    <Card
      className={cn("carousel-item w-72 h-32 flex flex-col justify-between cursor-pointer", isSelected ? "border-purple-500 border-2 border-solid shadow-xl": "")}
      event={
        recipe?.id
          ? {
              type: "VIEW_RECIPE",
              id: recipe.id,
            }
          : undefined
      }
    >
      <div className="flex flex-row gap-2 px-3 flex-1 justify-between items-center">
        <div className="flex flex-col gap-1 flex-1">
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
        <Button variant="outline" size="icon">
          <ExpandIcon />
        </Button>
      </div>
      <Separator />
      <EventTrigger
        asChild
        event={
          !isSelected
            ? { type: "SELECT_RECIPE_SUGGESTION", ...input }
            : recipe?.id
            ? { type: "UNSELECT", id: recipe.id }
            : undefined
        }
      >
        <div className="flex items-center justify-center py-3">
          {!isSelected ? (
            <>
              {recipe?.id ? (
                <Badge variant="secondary">
                  Select <CheckIcon className="ml-1" size={14} />
                </Badge>
              ) : (
                <Badge variant="secondary" className="opacity-40">
                  Select <CheckIcon className="ml-1" size={14} />
                </Badge>
              )}
            </>
          ) : (
            <>
              <Badge variant="secondary">
                Unselect <CheckIcon className="ml-1" size={14} />
              </Badge>
            </>
          )}
        </div>
      </EventTrigger>
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
