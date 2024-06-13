"use client";

import { useAppContext } from "@/hooks/useAppContext";
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
  ExternalLinkIcon,
  MoreVerticalIcon,
  ScrollIcon,
  ShoppingBasketIcon,
  XIcon
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo } from "react";
import { twc } from "react-twc";
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
import { ExitButton } from "./exit-button";
import { Ingredients } from "./ingredients";
import { Button } from "./input/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./input/dropdown-menu";
import { Instructions } from "./instructions";
import { RecipeMoreDropdownButton } from "./recipe-more-dropdown-button";
import { RecipeSelectCircleButton } from "./recipe-select-circle-button";
import { SaveButton } from "./save-button";
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
      state.context.sessionSnapshot?.context.feedItemIds[index];
    return feedItemId && focusedRecipeId
      ? !!state.context.sessionSnapshot?.context.feedItemsById[
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
      <CardHeader className="flex flex-row gap-2 justify-between">
        <div>
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
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mr-2">
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <div>
                  <span role="img" aria-label="more-like-this" className="mr-2">
                    👍
                  </span>
                  <span className="font-semibold">More</span> like this
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div>
                  <span role="img" aria-label="less-like-this" className="mr-2">
                    👎
                  </span>
                  <span className="font-semibold">Less</span> like this
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div>
                  <span role="img" aria-label="hide-this" className="mr-2">
                    🙈
                  </span>
                  <span className="font-semibold">Hide</span> this
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div>
                  <span role="img" aria-label="select" className="mr-2">
                    ✔️
                  </span>
                  <span className="font-semibold">Select</span> (
                  {feedItem?.recipes?.length || 0})
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-muted-foreground">
                <div>
                  <span
                    role="img"
                    aria-label="add-to-make-later"
                    className="mr-2"
                  >
                    ⏰
                  </span>
                  <span className="font-semibold">
                    Add ({feedItem?.recipes?.length || 0}) to{" "}
                  </span>
                  <span className="text-foreground font-semibold">
                    Make Later
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-muted-foreground">
                <div>
                  <span
                    role="img"
                    aria-label="add-to-favorites"
                    className="mr-2"
                  >
                    ❤️
                  </span>
                  <span className="font-semibold">
                    Add ({feedItem?.recipes?.length || 0}) to{" "}
                  </span>
                  <span className="text-foreground font-semibold">
                    Favorites
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
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
        state.context.sessionSnapshot?.context.feedItemIds[index];
      return feedItemId && focusedRecipeId
        ? !!state.context.sessionSnapshot?.context.feedItemsById[
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
  const selectRecipe = useMemo(
    () => createRecipeSelector(feedRecipe?.id),
    [feedRecipe?.id]
  );
  const recipe = usePageSessionSelector(selectRecipe);
  const isSelected = usePageSessionSelector(selectIsSelected);
  const context = useAppContext();
  const isInRecipeDetails = useSelector(context, (state) =>
    state.matches({ RecipeDetail: "Open" })
  );

  return (
    <Card
      className={cn(
        "carousel-item flex flex-col justify-start cursor-pointer",
        isInRecipeDetails
          ? "w-full md:w-[65%] lg:w-[50%] xl:w-[40%] 2xl:w-[33%] overflow-y-auto overflow-x-hidden"
          : "w-72 h-32",
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
      <div
        className={cn(
          "flex flex-row gap-3 p-4 justify-between items-start",
          !isInRecipeDetails ? "h-full" : "h-fit"
        )}
      >
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
            <div className="self-end">
              <ExternalLinkIcon />
              {/* <FavoriteButton id={recipe?.id} /> */}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <ExitButton />
            {/* {recipe?.slug ? (
              <Link href={`/recipe/${recipe.slug}`} target="_blank">
                <Button size="icon" variant="ghost" autoFocus={false}>
                  <ExternalLinkIcon />
                </Button>
              </Link>
            ) : (
              <Button size="icon" variant="ghost" autoFocus={false} disabled>
                <ExternalLinkIcon />
              </Button>
            )} */}
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
            <div
              className={cn(
                "flex flex-row gap-2 py-2 max-w-xl mx-auto justify-center w-full",
                !isInRecipeDetails ? "h-full" : ""
              )}
            >
              {/* <RecipeSelectButton id={recipe.id} /> */}
              {/* <PrintButton slug={recipe?.slug} /> */}
              {/* <CameraButton slug={recipe?.slug} /> */}
              <SaveButton id={recipe?.id} />
              <ShareButton slug={recipe.slug} name={recipe.name} />
              <RecipeSelectCircleButton id={recipe?.id} />
              {/* <FavoriteButton id={recipe?.id} />
              <RecipeSuggestionSelectButton
                itemIndex={input.itemIndex}
                recipeIndex={input.recipeIndex}
              /> */}
              <RecipeMoreDropdownButton />
              {/* <PrintButton slug={recipe?.slug} /> */}
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

const MyRecipeListItemContent = twc.div`flex flex-col gap-1 px-3 min-w-[5rem] items-start`;
const MyRecipeListItemTitle = twc.h4`font-semibold truncate`;
const MyRecipeListItemRecipeCount = twc.div`text-muted-foreground`;
const MyRecipeListItemCard = twc(
  Card
)`carousel-item h-24 flex flex-row gap-2 justify-start items-center`;

export const MyRecipeLists = () => {
  return (
    <div className="relative h-24">
      <div className="absolute top-0 w-screen left-1/2 transform -translate-x-1/2 z-10 flex flex-row justify-center">
        <div className="carousel carousel-center pl-2 pr-2 space-x-2">
          {/* <MyRecipeListItemCard variant="locontrast">
            <MyRecipeListItemContent>
              <span className="text-lg">✅</span>
              <MyRecipeListItemTitle>Selected</MyRecipeListItemTitle>
              <MyRecipeListItemRecipeCount>
                0 recipes
              </MyRecipeListItemRecipeCount>
            </MyRecipeListItemContent>
          </MyRecipeListItemCard> */}
          <MyRecipeListItemCard variant="locontrast">
            <MyRecipeListItemContent>
              <span className="text-lg">⏰</span>
              <MyRecipeListItemTitle>Make Later</MyRecipeListItemTitle>
              <MyRecipeListItemRecipeCount>
                32 recipes
              </MyRecipeListItemRecipeCount>
            </MyRecipeListItemContent>
          </MyRecipeListItemCard>
          <MyRecipeListItemCard variant="locontrast">
            <MyRecipeListItemContent>
              <span className="text-lg">❤️</span>
              <MyRecipeListItemTitle>Favorites</MyRecipeListItemTitle>
              <MyRecipeListItemRecipeCount>
                5 recipes
              </MyRecipeListItemRecipeCount>
            </MyRecipeListItemContent>
          </MyRecipeListItemCard>
          <MyRecipeListItemCard variant="locontrast">
            <MyRecipeListItemContent>
              <span className="text-lg">👍</span>
              <MyRecipeListItemTitle>Liked</MyRecipeListItemTitle>
              <MyRecipeListItemRecipeCount>
                0 recipes
              </MyRecipeListItemRecipeCount>
            </MyRecipeListItemContent>
          </MyRecipeListItemCard>
          <MyRecipeListItemCard variant="locontrast">
            <MyRecipeListItemContent>
              <span className="text-lg">👥</span>
              <MyRecipeListItemTitle>Recently Shared</MyRecipeListItemTitle>
              <MyRecipeListItemRecipeCount>
                8 recipes
              </MyRecipeListItemRecipeCount>
            </MyRecipeListItemContent>
          </MyRecipeListItemCard>
        </div>
      </div>
    </div>
  );
};

export const FeedCards = () => {
  const numFeedItemIds = usePageSessionSelector(selectNumFeedItemIds);
  const router = useRouter();
  useEffect(() => {
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
