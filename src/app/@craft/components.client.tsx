"use client";

import { Card } from "@/components/display/card";
import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import { useSelector } from "@/hooks/useSelector";
import { ChevronRightIcon, LoaderIcon, MoreHorizontalIcon } from "lucide-react";
import { useContext } from "react";
import { CraftContext } from "../context";

export const CraftItemIcon = () => {
  const actor = useContext(CraftContext);
  const isTyping = useSelector(actor, (state) => state.matches("Typing.True"));
  const isLoading = useSelector(actor, (state) =>
    state.matches("InstantRecipe.InProgress")
  );
  console.log({ isTyping });
  return isTyping ? (
    <MoreHorizontalIcon className="animate-pulse" />
  ) : isLoading ? (
    <LoaderIcon className="animate-spin" />
  ) : (
    <ChevronRightIcon className="dark:text-slate-700 text-slate-300" />
  );
};

export const InstantRecipeItem = () => {
  const actor = useContext(CraftContext);
  const description = useSelector(
    actor,
    (state) => state.context.instantRecipeMetadata?.description
  );
  const name = useSelector(
    actor,
    (state) => state.context.instantRecipeMetadata?.name
  );
  return (
    <Card
      event={{ type: "INSTANT_RECIPE" }}
      className="w-full flex flex-row gap-4 items-center px-3 cursor-pointer"
      tabIndex={0}
    >
      {/* <Avatar className="opacity-20">
        <AvatarFallback>{index + 1}.</AvatarFallback>
      </Avatar> */}
      <div className="flex flex-col gap-2 px-2 py-4 w-full sm:flex-row">
        <div className="sm:basis-60 sm:flex-shrink-0 font-semibold">
          {name ? name : <Skeleton className="w-2/3 sm:w-full h-7" />}
        </div>
        {description ? (
          <p className="line-clamp-4">{description}</p>
        ) : (
          <div className="flex flex-col gap-1 w-full">
            <Skeleton className="w-full h-5" />
            <Skeleton className="w-full h-5" />
            <Skeleton className="w-full h-5" />
          </div>
        )}
      </div>
      <div>
        <Button event={{ type: "INSTANT_RECIPE" }} variant="ghost" size="icon">
          <InstantRecipeIcon />
        </Button>
      </div>
      {/* <Badge className="opacity-20">Craft</Badge> */}
    </Card>
  );
};

export const SuggestionItem = ({ index }: { index: number }) => {
  const actor = useContext(CraftContext);
  const name = useSelector(
    actor,
    (state) => state.context.suggestions?.[index]?.name
  );
  const description = useSelector(
    actor,
    (state) => state.context.suggestions?.[index]?.description
  );
  return (
    <Card
      event={{ type: "SELECT_RESULT", index }}
      className="w-full flex flex-row gap-4 items-center px-3 cursor-pointer"
      tabIndex={index + 1}
    >
      {/* <Avatar className="opacity-20">
        <AvatarFallback>{index + 1}.</AvatarFallback>
      </Avatar> */}
      <div className="flex flex-col gap-2 px-2 py-4 w-full sm:flex-row">
        <div className="sm:basis-60 sm:flex-shrink-0 font-semibold">
          {name ? name : <Skeleton className="w-2/3 sm:w-full h-7" />}
        </div>
        {description ? (
          <p className="line-clamp-3">{description}</p>
        ) : (
          <div className="flex flex-col gap-1 w-full">
            <Skeleton className="w-full h-5" />
            <Skeleton className="w-full h-5" />
            <Skeleton className="w-full h-5" />
          </div>
        )}
      </div>
      <div>
        <Button variant="ghost" size="icon">
          <SuggestionIcon index={index} />
        </Button>
      </div>
      {/* <Badge className="opacity-20">Craft</Badge> */}
    </Card>
  );
};

const SuggestionIcon = ({ index }: { index: number }) => {
  const actor = useContext(CraftContext);
  const isTyping = useSelector(actor, (state) => state.matches("Typing.True"));
  const isLoading = useSelector(
    actor,
    (state) =>
      state.matches("Suggestions.InProgress") &&
      !state.context.suggestions?.[index + 1]
  );

  return isTyping ? (
    <MoreHorizontalIcon className="animate-pulse" />
  ) : isLoading ? (
    <LoaderIcon className="animate-spin" />
  ) : (
    <ChevronRightIcon className="dark:text-slate-700 text-slate-300" />
  );
};

const InstantRecipeIcon = () => {
  const actor = useContext(CraftContext);
  const isTyping = useSelector(actor, (state) => state.matches("Typing.True"));
  const isLoading = useSelector(actor, (state) =>
    state.matches("InstantRecipe.InProgress")
  );

  return isTyping ? (
    <MoreHorizontalIcon className="animate-pulse" />
  ) : isLoading ? (
    <LoaderIcon className="animate-spin" />
  ) : (
    <ChevronRightIcon className="dark:text-slate-700 text-slate-300" />
  );
};
