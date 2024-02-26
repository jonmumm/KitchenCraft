"use client";

import { Badge } from "@/components/display/badge";
import { Card, CardDescription, CardTitle } from "@/components/display/card";
import { Separator } from "@/components/display/separator";
import { Skeleton, SkeletonSentence } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import { useSelector } from "@/hooks/useSelector";
import { cn } from "@/lib/utils";
import { RecipeCraftingPlaceholder } from "@/modules/recipe/crafting-placeholder";
import { useStore } from "@nanostores/react";
import { ChevronsDownIcon, XIcon } from "lucide-react";
import { ComponentProps, ReactNode, useContext } from "react";
import { CraftContext } from "../context";
import { session$ } from "../session-store";
import {
  selectIsCreating,
  selectIsRemixing,
  selectPromptLength,
  selectTokens,
} from "./selectors";

export const CraftEmpty = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const promptLength = useSelector(actor, selectPromptLength);
  const tokens = useSelector(actor, selectTokens);

  return !tokens.length && promptLength === 0 ? <>{children}</> : null;
};

export const CraftPromptEmpty = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const promptLength = useSelector(actor, selectPromptLength);

  return promptLength === 0 ? <>{children}</> : null;
};
export const CraftPromptNotEmpty = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const promptLength = useSelector(actor, selectPromptLength);

  return promptLength !== 0 ? <>{children}</> : null;
};

export const HasTokens = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const numTokens = useSelector(actor, (state) => state.context.tokens.length);

  return numTokens !== 0 ? <>{children}</> : null;
};

export const CraftNotEmpty = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const promptLength = useSelector(actor, selectPromptLength);
  const tokens = useSelector(actor, selectTokens);

  return tokens.length || promptLength !== 0 ? <>{children}</> : null;
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

// export const InstantRecipeItem = () => {
//   const actor = useContext(CraftContext);
//   const description = useSelector(
//     actor,
//     (state) => state.context.instantRecipeMetadata?.description
//   );
//   const name = useSelector(
//     actor,
//     (state) => state.context.instantRecipeMetadata?.name
//   );
//   return (
//     <ResultCard index={0} event={{ type: "INSTANT_RECIPE" }}>
//       {/* <Avatar className="opacity-20">
//         <AvatarFallback>{index + 1}.</AvatarFallback>
//       </Avatar> */}
//       <div className="flex flex-col gap-2 p-3 w-full sm:flex-row">
//         <div className="sm:basis-60 sm:flex-shrink-0 font-semibold">
//           {name ? name : <Skeleton className="w-2/3 sm:w-full h-7" />}
//         </div>
//         {description ? (
//           <p className="line-clamp-4">{description}</p>
//         ) : (
//           <div className="flex flex-col gap-1 w-full">
//             <Skeleton className="w-full h-5" />
//             <Skeleton className="w-full h-5" />
//             <Skeleton className="w-full h-5" />
//           </div>
//         )}
//       </div>
//       <div className="w-24 flex flex-row justify-center">
//         {/* <Button event={{ type: "INSTANT_RECIPE" }} variant="ghost" size="icon"> */}
//         {/* <ClientOnly>
//           <InstantRecipeIcon />
//         </ClientOnly> */}
//         {/* </Button> */}
//       </div>
//       {/* <Badge className="opacity-20">Craft</Badge> */}
//     </ResultCard>
//   );
// };

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

// export const SuggestionItem = ({ index }: { index: number }) => {
//   const actor = useContext(CraftContext);
//   const name = useSelector(
//     actor,
//     (state) => state.context.suggestions?.[index]?.name
//   );
//   const description = useSelector(
//     actor,
//     (state) => state.context.suggestions?.[index]?.description
//   );
//   return (
//     <ResultCard event={{ type: "SELECT_RESULT", index }} index={index + 1}>
//       <div className="flex flex-col gap-2 p-3 w-full sm:flex-row">
//         <div className="sm:basis-60 sm:flex-shrink-0 font-semibold">
//           {name ? name : <Skeleton className="w-2/3 sm:w-full h-7" />}
//         </div>
//         {description ? (
//           <p className="line-clamp-3">{description}</p>
//         ) : (
//           <div className="flex flex-col gap-1 w-full">
//             <Skeleton className="w-full h-5" />
//             <Skeleton className="w-full h-5" />
//             <Skeleton className="w-full h-5" />
//           </div>
//         )}
//       </div>
//       <div className="w-24 flex flex-row justify-center">
//         <ClientOnly>
//           <SuggestionIcon index={index} />
//         </ClientOnly>
//       </div>
//     </ResultCard>
//   );
// };

// const SuggestionIcon = ({ index }: { index: number }) => {
//   const actor = useContext(CraftContext);
//   const isTyping = useSelector(actor, (state) =>
//     state.matches({ Typing: "True" })
//   );
//   const isSuggestionsLoading = useSelector(actor, selectIsSuggestionsLoading);

//   const isLoading =
//     useSelector(actor, (state) => !state.context.suggestions?.[index + 1]) &&
//     isSuggestionsLoading;

//   const hasSuggestion = useSelector(
//     actor,
//     (state) => !!state.context.suggestions?.[index]
//   );

//   return isTyping ? (
//     <EllipsisAnimation />
//   ) : isLoading ? (
//     <LoaderIcon className="animate-spin" />
//   ) : hasSuggestion ? (
//     <Badge variant="outline">Craft</Badge>
//   ) : (
//     <Badge variant="outline">
//       <Skeleton className="w-8 h-4" />
//     </Badge>
//   );
// };

// const InstantRecipeIcon = () => {
//   const actor = useContext(CraftContext);
//   const isTyping = useSelector(actor, (state) =>
//     state.matches({ Typing: "True" })
//   );
//   const promptLength = useSelector(actor, selectPromptLength);
//   const hasInstantRecipe = useSelector(
//     actor,
//     (state) => !!state.context.instantRecipeMetadata
//   );
//   const isLoading = useSelector(actor, selectIsInstantRecipeLoading);

//   return isTyping ? (
//     <EllipsisAnimation />
//   ) : isLoading ? (
//     <LoaderIcon className="animate-spin" />
//   ) : hasInstantRecipe ? (
//     <Badge variant="outline">Craft</Badge>
//   ) : (
//     <Badge variant="outline">
//       <Skeleton className="w-8 h-4" />
//     </Badge>
//   );
// };

export const CraftingPlacholder = () => {
  const actor = useContext(CraftContext);
  const selection = useSelector(actor, (state) => state.context.selection);

  return selection && <RecipeCraftingPlaceholder />;
};

export const AddedTokens = () => {
  const actor = useContext(CraftContext);
  const tokens = useSelector(actor, (state) => state.context.tokens);
  return (
    <div className="flex flex-row flex-wrap gap-2 px-4 mt-2">
      {tokens.map((token) => {
        return (
          <Badge
            className="flex flex-row gap-1"
            variant="secondary"
            key={token}
            event={{
              type: "REMOVE_TOKEN",
              token,
            }}
          >
            <span>{token}</span>
            <XIcon size={13} />
          </Badge>
        );
      })}
    </div>
  );
};

export const SuggestedRecipeCards = () => {
  const session = useStore(session$);
  const complete = session.context.numCompletedRecipes || 6 ;
  const items = new Array(complete).fill(0);

  return (
    <>
      {items.map((_, index) => {
        return (
          <SuggestedRecipeCard
            key={index}
            index={index}
          />
        );
      })}
    </>
  );
};

export const SuggestedRecipeCard = ({ index }: { index: number }) => {
  const actor = useContext(CraftContext);
  const session = useStore(session$);
  const recipe = session.context.suggestedRecipes[index];
  const isTyping = useSelector(actor, (state) =>
    state.matches({ Typing: "True" })
  );
  const currentItemIndex = useSelector(
    actor,
    (state) => state.context.currentItemIndex
  );

  const diffToCurrent = index - currentItemIndex;

  if (diffToCurrent < 0 || diffToCurrent >= 4) {
    return null;
  }

  const topOffset = diffToCurrent * 4;
  const scale = (100 - diffToCurrent * 5) / 100;
  const zIndex = 50 - diffToCurrent * 10;
  const position = diffToCurrent ? "absolute" : "relative";
  // const overflow = diffToCurrent !== 0 ? "hidden" : "";

  return (
    <Card
      className={`max-w-xl w-full top-0 ${position} transition-all`}
      style={{
        transform: `scale(${scale})`,
        minHeight: "200px",
        zIndex,
        marginTop: `-${topOffset * 3}px`,
      }}
      // style={{ scale }}
    >
      <div className="p-4 flex flex-col gap-2">
        <CardTitle className="flex flex-row items-center gap-2">
          {index + 1}.{" "}
          {recipe?.name ? (
            <p className="flex-1">{recipe.name}</p>
          ) : (
            <div className="flex-1 flex flex-row gap-2">
              <SkeletonSentence className="h-7" numWords={4} />
            </div>
          )}
          <Button event={{ type: "SKIP" }} variant="outline">
            <XIcon />
          </Button>
        </CardTitle>
        {recipe?.description ? (
          <CardDescription>{recipe.description}</CardDescription>
        ) : (
          <div className="flex-1">
            <SkeletonSentence className="h-4" numWords={12} />
          </div>
        )}
      </div>
      {/* <div className="flex flex-row gap-1 items-center">
          <TagIcon size={16} />
          <div className="flex flex-row gap-1">
            <Badge variant="secondary">Baking</Badge>
            <Badge variant="secondary">30 minutes</Badge>
            <Badge variant="secondary">Chocolate</Badge>
          </div>
        </div> */}
      {/* <Button
          event={{ type: "SKIP" }}
          variant="default"
          className="bg-slate-500"
        >
          <ChevronsLeftIcon /> Skip
        </Button> */}
      <Separator />
      <div className="p-4">
        <Button className="w-full">
          Continue Generating <ChevronsDownIcon size={16} />
        </Button>
      </div>
    </Card>
  );
};

export const SuggestedIngredientBadge = ({
  index,
  className,
}: {
  index: number;
  className: string;
}) => {
  const actor = useContext(CraftContext);
  const isTyping = useSelector(actor, (state) =>
    state.matches({ Typing: "True" })
  );
  const session = useStore(session$);
  const isGenerating =
    session.value.Craft.Generators.Ingredients === "Generating";
  const ingredient = session.context.suggestedIngredients[index];
  // const resultId = index, session.context.suggestedIngredientssResultId);
  // console.log(index, session.context.suggestedTags);

  if (!ingredient && !isTyping && !isGenerating) {
    return null;
  }

  if (!ingredient || isTyping) {
    return (
      <Badge
        className={cn(className, "carousel-item flex flex-row animate-pulse")}
        variant="secondary"
      >
        <Skeleton className="w-8 h-4" />
      </Badge>
    );
  }

  return (
    <Badge
      className={cn(className, "carousel-item flex flex-row cursor-pointer")}
      variant="secondary"
      event={{ type: "ADD_TOKEN", token: ingredient }}
    >
      {ingredient}
    </Badge>
  );
};

export const SuggestedTagBadge = ({
  index,
  className,
}: {
  index: number;
  className: string;
}) => {
  const actor = useContext(CraftContext);
  const isTyping = useSelector(actor, (state) =>
    state.matches({ Typing: "True" })
  );

  const session = useStore(session$);
  const tag = session.context.suggestedTags[index];
  const isGenerating = session.value.Craft.Generators.Tags === "Generating";
  // const isGenerating = session.matches({
  //   Craft: { Generators: { Tags: "Generating" } },
  // });
  // const resultId = index, session.context.suggestedIngredientssResultId);
  // console.log(index, session.context.suggestedTags);
  if (!tag && !isTyping && !isGenerating) {
    return null;
  }

  if (!tag || isTyping) {
    return (
      <Badge
        className={cn(className, "carousel-item flex flex-row animate-pulse")}
        variant="secondary"
      >
        <Skeleton className="w-8 h-4" />
      </Badge>
    );
  }

  return (
    <Badge
      className={cn(className, "carousel-item flex flex-row cursor-pointer")}
      variant="secondary"
      event={{ type: "ADD_TOKEN", token: tag }}
    >
      {tag}
    </Badge>
  );
};
