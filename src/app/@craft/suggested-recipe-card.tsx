"use client";

import { Badge } from "@/components/display/badge";
import { Card, CardDescription, CardTitle } from "@/components/display/card";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/display/collapsible";
import { Separator } from "@/components/display/separator";
import { Skeleton, SkeletonSentence } from "@/components/display/skeleton";
import { Ingredients } from "@/components/ingredients";
import { BackButton } from "@/components/input/back-button";
import EventTrigger from "@/components/input/event-trigger";
import { Instructions } from "@/components/instructions";
import { RecipeMoreDropdownButton } from "@/components/recipe-more-dropdown-button";
import { SaveButton } from "@/components/save-button";
import ScrollLockComponent from "@/components/scroll-lock";
import { ShareRecipeButton } from "@/components/share-button";
import { Tags } from "@/components/tags";
import { Times } from "@/components/times";
import { Yield } from "@/components/yield";
import { useAppContext } from "@/hooks/useAppContext";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useCombinedSelector } from "@/hooks/useCombinedSelector";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { useRecipe } from "@/hooks/useRecipe";
import { useSend } from "@/hooks/useSend";
import { cn } from "@/lib/utils";
import { createRecipeIdIsFocusedSelector } from "@/selectors/app.selectors";
import { createSuggestedRecipeIdAtIndexSelector } from "@/selectors/combined.selectors";
import {
  createRecipeHasNameSelector,
  createRecipeIsSavedInListSelector,
  createRecipeMatchPercentSelector,
} from "@/selectors/page-session.selectors";
import { Portal } from "@radix-ui/react-portal";
import {
  BookmarkIcon,
  MoveLeftIcon,
  ScrollIcon,
  ShoppingBasketIcon,
  XCircleIcon,
} from "lucide-react";
import { ReactNode, memo, useCallback, useMemo } from "react";
import { AppSnapshot } from "../app-machine";
import { RecipeDetailOverlay } from "../components.client";

export const SuggestedRecipeCard = memo(({ index }: { index: number }) => {
  const selectRecipeId = useMemo(
    () => createSuggestedRecipeIdAtIndexSelector(index),
    [index]
  );
  const recipeId = useCombinedSelector(selectRecipeId);

  const selectIsFocused = useMemo(
    () => (state: AppSnapshot) => {
      return !!recipeId && state.context.focusedRecipeId === recipeId;
    },
    [recipeId]
  );
  const isFocused = useAppSelector(selectIsFocused);
  const isExpanded = isFocused;
  const send = useSend();
  const selectRecipeIsSaved = useMemo(
    () => createRecipeIsSavedInListSelector(recipeId),
    [recipeId]
  );
  const isSaved = usePageSessionSelector(selectRecipeIsSaved);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (value && recipeId) {
        send({ type: "VIEW_RECIPE", id: recipeId });
      }
    },
    [send, recipeId]
  );
  const selectRecipeHasName = useMemo(
    () => createRecipeHasNameSelector(recipeId),
    [recipeId]
  );
  const hasName = usePageSessionSelector(selectRecipeHasName);

  return (
    <RecipeDetailContainer index={index}>
      <Card
        eventOnView={
          hasName
            ? {
                type: "VIEW_RESULT",
                index,
              }
            : undefined
        }
        className={cn(
          "carousel-item relative flex flex-col w-full max-w-3xl mx-auto",
          !isExpanded
            ? "hover:bg-slate-100 dark:hover:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 cursor-pointer"
            : ""
        )}
      >
        <EventTrigger
          event={recipeId ? { type: "VIEW_RECIPE", id: recipeId } : undefined}
          disabled={isExpanded}
          className={cn("flex flex-col p-4")}
        >
          <div className="flex flex-row gap-2 w-full">
            <div className="flex flex-col gap-2 w-full">
              <CardTitle className="flex flex-row items-center gap-2">
                {!isExpanded && isSaved && (
                  <BookmarkIcon
                    size={24}
                    className="absolute right-2 -top-2 stroke-purple-600 fill-purple-700"
                  />
                )}
                <span className="text-muted-foreground">{index + 1}. </span>
                <RecipeName id={recipeId} />
              </CardTitle>
              <RecipeDescription id={recipeId} />
              {isExpanded && (
                <div className="text-muted-foreground text-xs flex flex-row gap-2">
                  <span>Yields</span>
                  <span>
                    <Yield recipeId={recipeId} />
                  </span>
                </div>
              )}
            </div>

            {isExpanded && (
              <div className="flex flex-col gap-2 items-center">
                <BackButton variant="ghost">
                  <XCircleIcon />
                </BackButton>
              </div>
            )}
            {/* {!isExpanded && recipe?.id && recipe.name && (
              <div className="flex flex-col justify-center">
                <Button
                  size="icon"
                  variant="ghost"
                  event={{ type: "VIEW_RECIPE", id: recipe.id }}
                >
                  <ExpandIcon />
                </Button>
              </div>
            )} */}
          </div>
          <div className={"text-xs mt-2"}>
            <MatchBadge id={recipeId} />
          </div>
        </EventTrigger>
        <Collapsible
          open={isFocused}
          className="overflow-hidden"
          onOpenChange={handleOpenChange}
        >
          <CollapsibleContent>
            <RecipeActionBar id={recipeId} />
            {/* <div className="text-sm text-muted-foreground flex flex-row gap-2 items-center justify-center py-2"></div> */}
            <Separator />
            <div>
              <Times id={recipeId} />
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
                  <Ingredients recipeId={recipeId} />
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
                  <Instructions recipeId={recipeId} />
                </ol>
              </div>
            </div>
            <Separator />
            <div className="py-2">
              <Tags recipeId={recipeId} />
            </div>
            <Separator />
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {isExpanded && (
        <div className="mt-4 mb-24 flex flex-col items-center">
          <BackButton asChild>
            <Badge className="cursor-pointer" variant="default">
              <MoveLeftIcon size={14} className="mr-1" /> Back
            </Badge>
          </BackButton>
        </div>
      )}
    </RecipeDetailContainer>
  );
});
SuggestedRecipeCard.displayName = "SuggestedRecipeCard";

const RecipeDetailContainer = memo(
  ({ children, index }: { children: ReactNode; index: number }) => {
    const selectRecipeId = useMemo(
      () => createSuggestedRecipeIdAtIndexSelector(index),
      [index]
    );
    const recipeId = useCombinedSelector(selectRecipeId);
    const selectIsFocused = useMemo(
      () => (state: AppSnapshot) => {
        return !!recipeId && state.context.focusedRecipeId === recipeId;
      },
      [recipeId]
    );
    const isFocused = useAppSelector(selectIsFocused);
    console.log({ recipeId, isFocused });
    return (
      <div
        className={cn(
          isFocused
            ? "absolute inset-0 mb-8 standalone:mb-16 z-65"
            : "max-w-xl w-full"
        )}
      >
        {isFocused && (
          <Portal>
            <RecipeDetailOverlay />
          </Portal>
        )}
        <ScrollLockComponent
          active={isFocused}
          className={isFocused ? "p-4" : ""}
        >
          {children}
        </ScrollLockComponent>
      </div>
    );
  }
);
RecipeDetailContainer.displayName = "RecipeDetailContainer";

// const ViewObserverRef = ({ index }: { index: number }) => {
//   const handleInView = useCallback(() => {
//     console.log("IN VIEW!", index);
//   }, []);
//   const observerRef = useInView(handleInView);
//   return <div ref={observerRef} />;
// };

const RecipeActionBar = ({ id }: { id: string | undefined }) => {
  const recipe = useRecipe(id);

  const selectIsExpanded = useMemo(
    () => createRecipeIdIsFocusedSelector(id),
    [id]
  );
  const isExpanded = useAppSelector(selectIsExpanded);

  return (
    <>
      {isExpanded && recipe?.metadataComplete && (
        <div className="flex flex-row gap-2 p-2 max-w-xl mx-auto justify-center">
          <ShareRecipeButton slug={recipe.slug} name={recipe.name} />
          {/* <LikeButton id={recipe?.id} /> */}
          <SaveButton id={id} />
          <RecipeMoreDropdownButton id={id} />
        </div>
      )}
    </>
  );
};

const MatchBadge = ({ id }: { id: string | undefined }) => {
  const selectMatchPercent = useMemo(
    () => createRecipeMatchPercentSelector(id),
    [id]
  );
  const matchPercent = usePageSessionSelector(selectMatchPercent);

  return (
    <>
      {matchPercent !== undefined ? (
        <>
          {matchPercent === 100 && (
            <Badge variant="secondary">
              <span className="text-green-700 font-medium mr-1">
                Direct Match
              </span>{" "}
              • 100%
            </Badge>
          )}
          {matchPercent < 100 && (
            <Badge variant="outline">{matchPercent}% match</Badge>
          )}
        </>
      ) : (
        <>
          <Badge variant="outline">
            <Skeleton className="w-10 h-4" />
          </Badge>
        </>
      )}{" "}
    </>
  );
};

const RecipeName = ({ id }: { id?: string }) => {
  const recipe = useRecipe(id);

  return (
    <>
      {recipe?.name ? (
        <p className="flex-1">{recipe.name}</p>
      ) : (
        <div className="flex-1 flex flex-row gap-2">
          <SkeletonSentence className="h-7" numWords={4} />
        </div>
      )}{" "}
    </>
  );
};

const RecipeDescription = ({ id }: { id?: string }) => {
  const recipe = useRecipe(id);

  return (
    <>
      {recipe?.description ? (
        <CardDescription>{recipe.description}</CardDescription>
      ) : (
        <div className="flex-1">
          <SkeletonSentence className="h-4" numWords={12} />
        </div>
      )}{" "}
    </>
  );
};
