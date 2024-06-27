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
import { useEventHandler } from "@/hooks/useEventHandler";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { useSuggestedRecipeAtIndex } from "@/hooks/useSuggestedRecipeAtIndex";
import { cn } from "@/lib/utils";
import {
  createRecipeIsSavedInListSelector,
  createRecipeIsSelectedSelector,
} from "@/selectors/page-session.selectors";
import { ExtractAppEvent } from "@/types";
import { Portal } from "@radix-ui/react-portal";
import {
  BookmarkCheckIcon,
  MoveLeftIcon,
  ScrollIcon,
  ShoppingBasketIcon,
  XCircleIcon,
} from "lucide-react";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { AppSnapshot } from "../app-machine";
import { RecipeDetailOverlay } from "../components.client";

export const SuggestedRecipeCard = ({ index }: { index: number }) => {
  const recipe = useSuggestedRecipeAtIndex(index);
  const recipeId = recipe?.id;

  const actor = useAppContext();
  const selectIsFocused = useCallback(
    (state: AppSnapshot) => {
      return !!recipe?.id && state.context.focusedRecipeId === recipe.id;
    },
    [recipeId]
  );
  const isFocused = useSelector(actor, selectIsFocused);
  const isExpanded = isFocused;
  const send = useSend();
  const selectRecipeIsSelected = useMemo(
    () => createRecipeIsSelectedSelector(recipe?.id),
    [recipeId]
  );
  const isSelected = usePageSessionSelector(selectRecipeIsSelected);

  const selectRecipeIsSaved = useMemo(
    () => createRecipeIsSavedInListSelector(recipeId),
    [recipeId]
  );
  const isSaved = usePageSessionSelector(selectRecipeIsSaved);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (value && recipe?.id) {
        send({ type: "VIEW_RECIPE", id: recipe.id });
      }
    },
    [send, recipeId]
  );

  const [wasJustSelected, setWasJustSelected] = useState(false);

  const onSelectRecipe = useCallback(
    (event: ExtractAppEvent<"SELECT_RECIPE">) => {
      if (event.id === recipe?.id) {
        setWasJustSelected(true);
        setTimeout(() => {
          setWasJustSelected(false);
        }, 2500);
      }
    },
    [setWasJustSelected, recipe]
  );

  useEventHandler("SELECT_RECIPE", onSelectRecipe);

  return (
    <RecipeDetailContainer index={index}>
      <Card
        className={cn(
          "carousel-item relative flex flex-col w-full max-w-3xl mx-auto",
          !isExpanded && isSelected
            ? "border-purple-500 border-2 border-solid shadow-xl"
            : !isExpanded && recipe?.name
            ? "hover:bg-slate-100 dark:hover:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 cursor-pointer"
            : ""
        )}
      >
        <EventTrigger
          event={
            recipe?.id ? { type: "VIEW_RECIPE", id: recipe.id } : undefined
          }
          disabled={isExpanded}
          className={cn("flex flex-col p-4")}
        >
          <div className="flex flex-row gap-2 w-full">
            <div className="flex flex-col gap-2 w-full">
              <CardTitle className="flex flex-row items-center gap-2">
                {!isExpanded && isSaved && (
                  <BookmarkCheckIcon
                    size={32}
                    className="absolute right-4 -top-2"
                  />
                )}
                <span className="text-muted-foreground">{index + 1}. </span>
                {recipe?.name ? (
                  <p className="flex-1">{recipe.name}</p>
                ) : (
                  <div className="flex-1 flex flex-row gap-2">
                    <SkeletonSentence className="h-7" numWords={4} />
                  </div>
                )}
              </CardTitle>
              {recipe?.description ? (
                <CardDescription>{recipe.description}</CardDescription>
              ) : (
                <div className="flex-1">
                  <SkeletonSentence className="h-4" numWords={12} />
                </div>
              )}
              {isExpanded && (
                <div className="text-muted-foreground text-xs flex flex-row gap-2">
                  <span>Yields</span>
                  <span>
                    <Yield recipeId={recipe?.id} />
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
            {recipe?.matchPercent !== undefined ? (
              <>
                {recipe.matchPercent === 100 && (
                  <Badge variant="secondary">
                    <span className="text-green-700 font-medium mr-1">
                      Direct Match
                    </span>{" "}
                    • 100%
                  </Badge>
                )}
                {recipe.matchPercent < 100 && (
                  <Badge variant="outline">{recipe.matchPercent}% match</Badge>
                )}
              </>
            ) : (
              <>
                <Badge variant="outline">
                  <Skeleton className="w-10 h-4" />
                </Badge>
              </>
            )}
          </div>
        </EventTrigger>
        <Collapsible
          open={isFocused}
          className="overflow-hidden"
          onOpenChange={handleOpenChange}
        >
          <CollapsibleContent>
            {isExpanded && recipe?.metadataComplete && (
              <div className="flex flex-row gap-2 p-2 max-w-xl mx-auto justify-center">
                <ShareRecipeButton slug={recipe.slug} name={recipe.name} />
                {/* <LikeButton id={recipe?.id} /> */}
                <SaveButton id={recipe?.id} />
                <RecipeMoreDropdownButton id={recipe?.id} />
              </div>
            )}
            {/* <div className="text-sm text-muted-foreground flex flex-row gap-2 items-center justify-center py-2"></div> */}
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
};
const RecipeDetailContainer = ({
  children,
  index,
}: {
  children: ReactNode;
  index: number;
}) => {
  const recipe = useSuggestedRecipeAtIndex(index);
  const actor = useAppContext();
  const selectIsFocused = useCallback(
    (state: AppSnapshot) => {
      return !!recipe?.id && state.context.focusedRecipeId === recipe.id;
    },
    [recipe?.id]
  );
  const isFocused = useSelector(actor, selectIsFocused);
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
};
