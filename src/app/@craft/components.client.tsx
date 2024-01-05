"use client";

import { Badge } from "@/components/display/badge";
import { Card } from "@/components/display/card";
import { Skeleton } from "@/components/display/skeleton";
import { EllipsisAnimation } from "@/components/feedback/ellipsis-animation";
import { Button } from "@/components/input/button";
import { RecipeCraftingPlaceholder } from "@/components/modules/recipe/crafting-placeholder";
import { useSelector } from "@/hooks/useSelector";
import { cn } from "@/lib/utils";
import { LoaderIcon } from "lucide-react";
import { ComponentProps, ReactNode, useContext } from "react";
import { CraftContext } from "../context";
import {
  selectIsCreating,
  selectIsInstantRecipeLoading,
  selectIsRemixing,
  selectPromptLength,
} from "./selectors";
import ClientOnly from "@/components/util/client-only";

export const CraftEmpty = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const promptLength = useSelector(actor, selectPromptLength);

  return promptLength === 0 ? <>{children}</> : null;
};
export const CraftNotEmpty = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const promptLength = useSelector(actor, selectPromptLength);

  return promptLength !== 0 ? <>{children}</> : null;
};
export const RecipeCreating = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const isCreating = useSelector(actor, selectIsCreating);
  return isCreating ? <>{children}</> : null;
};
export const CraftInputting = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  // const isTyping = useSelector(actor, selectIsTyping);
  // const promptLength = useSelector(actor, selectPromptLength);
  const isCreating = useSelector(actor, selectIsCreating);
  const isRemixing = useSelector(actor, selectIsRemixing);

  return !isRemixing && !isCreating ? <>{children}</> : null;
  // return !isCreating && (isTyping || promptLength) ? <>{children}</> : null;
};

const VisibilityControl = ({
  visible,
  children,
}: {
  visible: boolean;
  children: ReactNode;
}) => {
  const style = {
    display: visible ? "block" : "none",
  };

  return (
    <div suppressHydrationWarning style={style}>
      {children}
    </div>
  );
};

export const RemixEmpty = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const isCreating = useSelector(actor, selectIsCreating);
  const isRemixing = useSelector(actor, selectIsRemixing);
  const promptLength = useSelector(actor, selectPromptLength);
  const visible = !promptLength && isRemixing && !isCreating;
  return <VisibilityControl visible={visible}>{children}</VisibilityControl>;
};

export const RemixInputting = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const isCreating = useSelector(actor, selectIsCreating);
  const isRemixing = useSelector(actor, selectIsRemixing);
  const promptLength = useSelector(actor, selectPromptLength);
  const visible = !!promptLength && isRemixing && !isCreating;
  return <VisibilityControl visible={visible}>{children}</VisibilityControl>;
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
    <ResultCard index={0} event={{ type: "INSTANT_RECIPE" }}>
      {/* <Avatar className="opacity-20">
        <AvatarFallback>{index + 1}.</AvatarFallback>
      </Avatar> */}
      <div className="flex flex-col gap-2 p-3 w-full sm:flex-row">
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
      <div className="w-24 flex flex-row justify-center">
        {/* <Button event={{ type: "INSTANT_RECIPE" }} variant="ghost" size="icon"> */}
        <ClientOnly>
          <InstantRecipeIcon />
        </ClientOnly>
        {/* </Button> */}
      </div>
      {/* <Badge className="opacity-20">Craft</Badge> */}
    </ResultCard>
  );
};

export const ResultCard = ({
  index,
  children,
  ...props
}: {
  index: number;
} & ComponentProps<typeof Card>) => {
  const actor = useContext(CraftContext);
  const isFocused = useSelector(
    actor,
    (state) => state.context.currentItemIndex === index
  );

  return (
    <Card
      id={`result-${index}`}
      variant="interactive"
      {...props}
      className={cn(
        `w-full flex flex-row justify-between items-center cursor-pointer ${
          isFocused ? `outline-blue-500 outline outline-2` : ``
        }`,
        props.className
      )}
    >
      {children}
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
    <ResultCard event={{ type: "SELECT_RESULT", index }} index={index + 1}>
      <div className="flex flex-col gap-2 p-3 w-full sm:flex-row">
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
      <div className="w-24 flex flex-row justify-center">
        <ClientOnly>
          <SuggestionIcon index={index} />
        </ClientOnly>
      </div>
    </ResultCard>
  );
};

const SuggestionIcon = ({ index }: { index: number }) => {
  const actor = useContext(CraftContext);
  const isTyping = useSelector(actor, (state) => state.matches("Typing.True"));
  const isSuggestionsLoading = useSelector(actor, (state) =>
    state.matches("Suggestions.InProgress")
  );

  const isLoading =
    useSelector(actor, (state) => !state.context.suggestions?.[index + 1]) ||
    isSuggestionsLoading;

  const hasSuggestion = useSelector(
    actor,
    (state) => !!state.context.suggestions?.[index]
  );

  return isTyping ? (
    <EllipsisAnimation />
  ) : isLoading ? (
    <LoaderIcon className="animate-spin" />
  ) : hasSuggestion ? (
    <Badge variant="outline">Craft</Badge>
  ) : (
    <Badge variant="outline">
      <Skeleton className="w-8 h-4" />
    </Badge>
  );
};

const InstantRecipeIcon = () => {
  const actor = useContext(CraftContext);
  const isTyping = useSelector(actor, (state) => state.matches("Typing.True"));
  const promptLength = useSelector(actor, selectPromptLength);
  const hasInstantRecipe = useSelector(
    actor,
    (state) => !!state.context.instantRecipeMetadata
  );
  const isLoading = useSelector(actor, selectIsInstantRecipeLoading);

  return isTyping ? (
    <EllipsisAnimation />
  ) : isLoading ? (
    <LoaderIcon className="animate-spin" />
  ) : hasInstantRecipe ? (
    <Badge variant="outline">Craft</Badge>
  ) : (
    <Badge variant="outline">
      <Skeleton className="w-8 h-4" />
    </Badge>
  );
};

export const CraftingPlacholder = () => {
  const actor = useContext(CraftContext);
  const selection = useSelector(actor, (state) => state.context.selection);

  return selection && <RecipeCraftingPlaceholder />;
};

export const ClearResultsItem = () => {
  return (
    <ResultCard
      className="w-full p-4 flex-row justify-center hidden prompt-dirty:flex"
      index={7}
      event={{ type: "CLEAR" }}
    >
      <Button variant="ghost">Clear</Button>
    </ResultCard>
  );
};
