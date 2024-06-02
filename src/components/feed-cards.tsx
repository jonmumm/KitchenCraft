"use client";

import { useAppContext } from "@/app/@craft/hooks";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { useSelector } from "@/hooks/useSelector";
import { cn } from "@/lib/utils";
import {
  createFeedItemAtIndexSelector,
  createFeedItemRecipeAtIndexSelector,
  createRecipeIsSelectedSelector,
  createRecipeSelector,
  selectNumFeedItemIds,
} from "@/selectors/page-session.selectors";
import { Portal } from "@radix-ui/react-portal";
import useEmblaCarousel from "embla-carousel-react";
import {
  CheckIcon,
  CircleSlash2Icon,
  ExternalLinkIcon,
  ScrollIcon,
  ShoppingBasketIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo } from "react";
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
import { Ingredients } from "./ingredients";
import { Button } from "./input/button";
import { Instructions } from "./instructions";
import { PrintButton } from "./print-button";
import { useScrollLock } from "./scroll-lock";
import { ShareButton } from "./share-button";
import { Tags } from "./tags";
import { Times } from "./times";
import { Yield } from "./yield";

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

  const isActive =
    usePageSessionSelector((state) => {
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
    <div className={cn("relative h-28")}>
      {isActive && (
        <Portal>
          <div className="bg-black opacity-60 fixed inset-0 z-50"></div>
        </Portal>
      )}
      <div
        className={cn(
          "z-10 flex flex-col justify-between lg:items-center",
          isActive
            ? "fixed inset-0 z-60 py-4"
            : "absolute left-1/2 transform -translate-x-1/2 w-screen top-0"
        )}
      >
        <div
          className={cn(
            "carousel carousel-center",
            isActive
              ? "w-full h-full pl-4 pr-8 space-x-2"
              : "pl-2 pr-8 space-x-2"
          )}
        >
          {children}
        </div>
        {isActive && (
          <div className="mt-4 mb-8 flex flex-col items-center">
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
  const feedRecipe = usePageSessionSelector(selectFeedRecipe);
  const selectIsSelected = useMemo(
    () => createRecipeIsSelectedSelector(feedRecipe?.id),
    [feedRecipe?.id]
  );
  console.log({ selectIsSelected });
  const selectRecipe = useMemo(
    () => createRecipeSelector(feedRecipe?.id),
    [feedRecipe?.id]
  );
  const recipe = usePageSessionSelector(selectRecipe);
  const isSelected = usePageSessionSelector(selectIsSelected);
  console.log({ isSelected });
  const context = useAppContext();
  const isInRecipeDetails = useSelector(context, (state) =>
    state.matches({ RecipeDetail: "Open" })
  );

  return (
    <Card
      className={cn(
        "carousel-item flex flex-col justify-between cursor-pointer",
        isInRecipeDetails
          ? "w-full md:w-[65%] lg:w-[50%] xl:w-[40%] 2xl:w-[33%] overflow-y-auto overflow-x-hidden"
          : "w-72 h-28",
        !isInRecipeDetails && isSelected
          ? "border-purple-500 border-2 border-solid shadow-xl"
          : ""
      )}
      event={
        !isInRecipeDetails && feedRecipe?.id
          ? {
              type: "VIEW_RECIPE",
              id: feedRecipe.id,
            }
          : undefined
      }
    >
      <div className="flex flex-row gap-2 p-4 justify-between items-start h-fit">
        <div className="flex flex-col gap-1">
          <CardTitle className={isInRecipeDetails ? "text-lg" : "text-md"}>
            {feedRecipe?.name ? (
              <>{feedRecipe.name}</>
            ) : (
              <SkeletonSentence numWords={3} className="h-6" />
            )}
          </CardTitle>
          {!isInRecipeDetails ? (
            <>
              {feedRecipe?.tagline ? (
                <CardDescription className="text-sm text-muted-foreground">
                  {feedRecipe.tagline}
                </CardDescription>
              ) : (
                <SkeletonSentence numWords={3} className="h-4" />
              )}
            </>
          ) : (
            <>
              {recipe?.description ? (
                <CardDescription className="text-sm text-muted-foreground">
                  {recipe.description}
                </CardDescription>
              ) : (
                <SkeletonSentence numWords={10} className="h-4" />
              )}
            </>
          )}
          {/* {!isInRecipeDetails ? <>{
          
          feedRecipe?.tagline ?
          
            <CardDescription className="text-sm text-muted-foreground">
              {feedRecipe.tagline}
            </CardDescription>
           :
          <SkeletonSentence numWords={3} className="h-4" />
          }</>} */}
        </div>
        {!isInRecipeDetails ? (
          <>
            <Button
              event={
                feedRecipe?.id
                  ? !isSelected
                    ? { type: "SELECT_RECIPE_SUGGESTION", ...input }
                    : { type: "UNSELECT", id: feedRecipe.id }
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
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              size="icon"
              variant="ghost"
              autoFocus={false}
              event={{ type: "EXIT" }}
            >
              <XCircleIcon />
            </Button>
            {recipe?.slug ? (
              <Link href={`/recipe/${recipe.slug}`} target="_blank">
                <Button size="icon" variant="ghost" autoFocus={false}>
                  <ExternalLinkIcon />
                </Button>
              </Link>
            ) : (
              <Button size="icon" variant="ghost" autoFocus={false} disabled>
                <ExternalLinkIcon />
              </Button>
            )}
          </div>
        )}
      </div>
      {isInRecipeDetails && (
        <>
          <div className="text-muted-foreground text-xs flex flex-row gap-2 px-4">
            <span>Yields</span>
            <span>
              <Yield recipeId={recipe?.id} />
            </span>
          </div>
          <Separator className="mt-4" />
          {recipe?.name && (
            <div className="flex flex-row gap-2 py-2 max-w-xl mx-auto justify-between">
              <ShareButton slug={recipe.slug} name={recipe.name} />
              {!isSelected ? (
                <Button
                  className="flex-1 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white"
                  event={{
                    type: "SELECT_RECIPE_SUGGESTION",
                    itemIndex: input.itemIndex,
                    recipeIndex: input.recipeIndex,
                  }}
                >
                  Select <CheckIcon className="ml-2" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="flex-1"
                  event={{ type: "UNSELECT", id: recipe.id }}
                >
                  Unselect <CircleSlash2Icon className="ml-2" />
                </Button>
              )}
              <PrintButton slug={recipe?.slug} />
            </div>
          )}
          <Separator />
          <div>
            <Times
              activeTime={recipe?.activeTime}
              totalTime={recipe?.totalTime}
              cookTime={recipe?.cookTime}
            />
          </div>
          <Separator />
          <div className="px-5">
            <div className="flex flex-row justify-between gap-1 items-center py-4">
              <h3 className="uppercase text-xs font-bold text-accent-foreground">
                Ingredients
              </h3>
              <ShoppingBasketIcon />
            </div>
            <div className="mb-4 flex flex-col gap-2">
              <ul className="list-disc pl-5 flex flex-col gap-2">
                <Ingredients recipeId={recipe?.id} />
              </ul>
            </div>
          </div>
          <Separator />
          <div className="px-5">
            <div className="flex flex-row justify-between gap-1 items-center py-4">
              <h3 className="uppercase text-xs font-bold text-accent-foreground">
                Instructions
              </h3>
              <ScrollIcon />
            </div>
            <div className="mb-4 flex flex-col gap-2">
              <ol className="list-decimal pl-5 flex flex-col gap-2">
                <Instructions recipeId={recipe?.id} />
              </ol>
            </div>
          </div>
          <Separator />
          <div className="py-2">
            <Tags recipeId={recipe?.id} />
          </div>
        </>
      )}
    </Card>
  );
};

export const FeedCards = () => {
  const numFeedItemIds = usePageSessionSelector(selectNumFeedItemIds);
  const router = useRouter();
  useEffect(() => {
    console.log("prefetching /quiz");
    router.prefetch("/quiz");
  }, [router]);
  const items = new Array(Math.max(numFeedItemIds, 3)).fill(0);

  return (
    <div className="m-4 flex flex-col gap-8">
      {items.map((_, index) => {
        return <FeedCardItem key={index} index={index} />;
      })}
    </div>
  );
};
