"use client";

import { useAppContext } from "@/app/@craft/hooks";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { useSelector } from "@/hooks/useSelector";
import { cn } from "@/lib/utils";
import {
  createFeedItemAtIndexSelector,
  createFeedItemRecipeAtIndexSelector,
  createRecipeIsSelectedSelector,
  selectNumFeedItemIds,
} from "@/selectors/page-session.selectors";
import { Portal } from "@radix-ui/react-portal";
import useEmblaCarousel from "embla-carousel-react";
import { CheckIcon, XIcon } from "lucide-react";
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
import { Button } from "./input/button";
import { useScrollLock } from "./scroll-lock";

const FeedCardItem = ({ index }: { index: number }) => {
  const selectFeedItem = useMemo(
    () => createFeedItemAtIndexSelector(index),
    [index]
  );
  const feedItem = usePageSessionSelector(selectFeedItem);

  const recipeItems = new Array(
    Math.max(feedItem?.recipes?.length || 0, 3)
  ).fill(0);
  const context = useAppContext();
  const focusedRecipeId = useSelector(
    context,
    (state) => state.context.focusedRecipeId
  );

  const isInFocus = usePageSessionSelector((state) => {
    const feedItemId =
      state.context.browserSessionSnapshot?.context.feedItemIds[index];
    return feedItemId && focusedRecipeId
      ? !!state.context.browserSessionSnapshot?.context.feedItems[
          feedItemId
        ]?.recipes?.find((recipe) => recipe?.id === focusedRecipeId)
      : false;
  });

  return (
    <Card
      className={cn(
        "max-w-3xl w-full mx-auto border-solid border-t-4",
        isInFocus ? "absolute inset-0" : ""
      )}
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
        <FeedCardRecipeCarousel index={index}>
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

const RecipeListCarousel = ({
  children,
  recipeIds,
  currentIndex,
}: {
  children: ReactNode;
  recipeIds: string[];
  currentIndex: number;
}) => {
  const currentRecipeId = recipeIds[currentIndex];

  const RecipeListCarouselCurrentItem = ({
    children,
  }: {
    children: ReactNode;
  }) => {
    return <div className="embla__slide">{children}</div>;
  };

  const RecipeListCarouselPreviousItems = () => {
    const previousRecipeIds = recipeIds.slice(0, currentIndex);
    return <></>;
  };
  const RecipeListCarouselNextItems = () => {
    const previousRecipeIds = recipeIds.slice(0, currentIndex);
    return <></>;
  };

  return (
    <RecipeListCarouselContent>
      <RecipeListCarouselPreviousItems />
      <RecipeListCarouselCurrentItem>{children}</RecipeListCarouselCurrentItem>
      <RecipeListCarouselNextItems />
    </RecipeListCarouselContent>
  );
};

const RecipeListCarouselCurrentItem = ({
  children,
}: {
  children: ReactNode;
}) => {
  return <></>;
};

const RecipeListCarouselNextItems = () => {
  return <></>;
};

const RecipeListCarouselContent = ({ children }: { children: ReactNode }) => {
  const [emblaRef, emblaAPI] = useEmblaCarousel();

  return (
    <div ref={emblaRef} className="embla flex-1 relative">
      <div className="embla__container absolute inset-0">{children}</div>
    </div>
  );
};

const FeedCardRecipeCarousel = ({
  children,
  index,
}: {
  children: ReactNode;
  index: number;
}) => {
  const context = useAppContext();
  const isInRecipeDetails = useSelector(context, (state) =>
    state.matches({ RecipeDetail: "Open" })
  );
  const focusedRecipeId = useSelector(
    context,
    (state) => state.context.focusedRecipeId
  );

  const isActive = usePageSessionSelector((state) => {
    const feedItemId =
      state.context.browserSessionSnapshot?.context.feedItemIds[index];
    return feedItemId && focusedRecipeId
      ? !!state.context.browserSessionSnapshot?.context.feedItems[
          feedItemId
        ]?.recipes?.find((recipe) => recipe?.id === focusedRecipeId)
      : false;
  }) && isInRecipeDetails;

  useScrollLock(isActive);

  const Overlay = () => {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"></div>
    );
  };

  return (
    <div className={cn("relative h-32")}>
      {isActive && (
        <Portal>
          <Overlay />
        </Portal>
      )}
      <div
        className={cn(
          "top-0 w-screen left-1/2 transform -translate-x-1/2 z-10 flex flex-col justify-between lg:items-center",
          isActive ? "fixed bottom-0 z-60" : "absolute"
        )}
      >
        <div
          className={cn(
            "carousel carousel-center pl-2 pr-8 space-x-2",
            isActive ? "flex-1" : ""
          )}
        >
          {children}
        </div>
        {isActive && (
          <div className="mt-4 mb-24 flex flex-col items-center">
            <Badge event={{ type: "EXIT" }}>
              Close <XIcon size={14} className="ml-1" />
            </Badge>
          </div>
        )}
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
  const selectIsSelected = useMemo(
    () => createRecipeIsSelectedSelector(recipe?.id),
    [recipe?.id]
  );
  const isSelected = usePageSessionSelector(selectIsSelected);

  return (
    <Card
      className={cn(
        "carousel-item w-72 h-32 flex flex-col justify-between cursor-pointer",
        isSelected ? "border-purple-500 border-2 border-solid shadow-xl" : ""
      )}
      event={
        recipe?.id
          ? {
              type: "VIEW_RECIPE",
              id: recipe.id,
            }
          : undefined
      }
    >
      <div className="flex flex-row gap-2 px-4 flex-1 justify-between items-center">
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
        <Button
          event={
            recipe?.id
              ? !isSelected
                ? { type: "SELECT_RECIPE_SUGGESTION", ...input }
                : { type: "UNSELECT", id: recipe.id }
              : undefined
          }
          className={cn(
            "rounded-full",
            isSelected ? "border-purple-700 border-2 border-solid" : ""
          )}
          variant="outline"
          size="icon"
        >
          <CheckIcon className={!isSelected ? "hidden" : "block"} />
        </Button>
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
