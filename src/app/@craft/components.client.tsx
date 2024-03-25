"use client";

import { Badge } from "@/components/display/badge";
import { Card, CardDescription, CardTitle } from "@/components/display/card";
import { Separator } from "@/components/display/separator";
import { Skeleton, SkeletonSentence } from "@/components/display/skeleton";
import { Input } from "@/components/input";
import { Button } from "@/components/input/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/input/form";
import { useSelector } from "@/hooks/useSelector";
import { cn, formatDuration, sentenceToSlug } from "@/lib/utils";
import { RecipeCraftingPlaceholder } from "@/modules/recipe/crafting-placeholder";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStore } from "@nanostores/react";
import {
  ClockIcon,
  ScrollIcon,
  ShoppingBasketIcon,
  TagIcon,
  XIcon,
} from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ReactNode,
  useCallback,
  useContext,
  useState,
  useSyncExternalStore,
} from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CraftContext } from "../context";
import { SessionStoreContext } from "../session-store.context";
import { buildInput } from "../utils";
import {
  selectIsCreating,
  selectIsRemixing,
  selectPromptLength,
} from "./selectors";
// import {
//   selectIsCreating,
//   selectIsRemixing,
//   selectPromptLength,
//   selectTokens,
// } from "./selectors";
//   selectIsCreating,
//   selectIsRemixing,
//   selectPromptLength,
//   selectTokens,
// } from "./selectors";

export const CraftEmpty = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const promptLength = useSelector(actor, selectPromptLength);
  const tokens = useTokens();

  return !tokens.length && promptLength === 0 ? <>{children}</> : null;
};

export const CraftNotReadyToSave = ({ children }: { children: ReactNode }) => {
  const recipe = useCurrentRecipe();
  const readyToSave = recipe && recipe.ingredients?.length;
  if (!readyToSave) {
    return <>{children}</>;
  }
  return null;
};

export const CraftReadyToSave = ({ children }: { children: ReactNode }) => {
  const recipe = useCurrentRecipe();
  if (recipe && recipe.ingredients?.length) {
    return <>{children}</>;
  }
  return null;
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
  const numTokens = useTokens().length;

  return numTokens !== 0 ? <>{children}</> : null;
};

export const CraftNotSaving = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const saving = useSelector(
    actor,
    (state) => !state.matches({ Creating: "False" })
  );

  return !saving ? <>{children}</> : null;
};

export const CraftSaving = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const saving = useSelector(
    actor,
    (state) => !state.matches({ Creating: "False" })
  );

  return saving ? <>{children}</> : null;
};

export const CraftNotEmpty = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const promptLength = useSelector(actor, selectPromptLength);
  const tokens = useTokens();

  return tokens.length || promptLength !== 0 ? <>{children}</> : null;
};
export const RecipeCreating = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const isCreating = useSelector(actor, (state) =>
    state.matches({ Creating: "InProgress" })
  );
  return isCreating ? <>{children}</> : null;
};

export const RecipeNavigating = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const isNavigating = useSelector(actor, (state) =>
    state.matches({ Creating: "Navigating" })
  );
  return isNavigating ? <>{children}</> : null;
};

export const CraftInputting = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  // const isTyping = useSelector(actor, selectIsTyping);
  // const promptLength = useSelector(actor, selectPromptLength);
  const isNotCreating = useSelector(actor, (state) =>
    state.matches({ Creating: "False" })
  );
  const isRemixing = useSelector(actor, selectIsRemixing);

  return !isRemixing && isNotCreating ? <>{children}</> : null;
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

// const ResultCard = ({
//   index,
//   children,
//   ...props
// }: {
//   index: number;
// } & ComponentProps<typeof Card>) => {
//   const actor = useContext(CraftContext);
//   const isFocused = useSelector(
//     actor,
//     (state) => state.context.currentItemIndex === index
//   );

//   return (
//     <Card
//       id={`result-${index}`}
//       variant="interactive"
//       {...props}
//       className={cn(
//         `w-full flex flex-row justify-between items-center cursor-pointer ${
//           isFocused ? `outline-blue-500 outline outline-2` : ``
//         }`,
//         props.className
//       )}
//     >
//       {children}
//     </Card>
//   );
// };

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
  const tokens = useTokens();
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
  const session$ = useSessionStore();
  const numCards = useCurrentItemIndex() + 6;
  const items = new Array(numCards).fill(0);

  return (
    <>
      {items.map((_, index) => {
        return <SuggestedRecipeCard key={index} index={index} />;
      })}
    </>
  );
};

const useSessionStore = () => {
  return useContext(SessionStoreContext);
};

const useNumCompletedRecipes = () => {
  const session$ = useSessionStore();
  return useSyncExternalStore(
    session$.subscribe,
    () => {
      return session$.get().context.numCompletedRecipes;
    },
    () => {
      return session$.get().context.numCompletedRecipes;
    }
  );
};

const useCurrentItemIndex = () => {
  const session$ = useSessionStore();
  return useSyncExternalStore(
    session$.subscribe,
    () => {
      return session$.get().context.currentItemIndex;
    },
    () => {
      return session$.get().context.currentItemIndex;
    }
  );
};

const useTokens = () => {
  const session$ = useSessionStore();
  const { context } = useStore(session$);
  return context.tokens;
};

const useCurrentRecipe = () => {
  const session$ = useSessionStore();
  const session = useStore(session$);
  // const recipeId =
  //   session.context.suggestedRecipes[session.context.currentItemIndex];
  // if (!recipeId) {
  //   return null;
  // }
  // const recipe = session.context.recipes[recipeId];
  // if (!recipe) {
  //   return null;
  // }
  const recipeId =
    session.context.suggestedRecipes[session.context.currentItemIndex];
  if (!recipeId) {
    return null;
  }

  const recipe = recipeId ? session.context.recipes[recipeId] : undefined;
  return recipe;
};

export const SuggestedRecipeCard = ({ index }: { index: number }) => {
  const session$ = useSessionStore();
  const session = useStore(session$);
  const recipeId = session.context.suggestedRecipes[index];
  const recipe = recipeId ? session.context.recipes[recipeId] : undefined;
  const currentItemIndex = useCurrentItemIndex();

  const diffToCurrent = index - currentItemIndex;

  if (diffToCurrent < 0 || diffToCurrent >= 4) {
    return null;
  }

  const scale = (100 - diffToCurrent * 5) / 100;
  const topOffset = -diffToCurrent * 4;
  // const topOffset = diffToCurrent
  //   ? -4 * (1 + (1 - scale)) - diffToCurrent * 28
  //   : 0;
  const zIndex = 50 - diffToCurrent * 10;
  const position = diffToCurrent ? "absolute" : "relative";
  // const overflow = diffToCurrent !== 0 ? "hidden" : "";

  return (
    // <SwipeableCard
    //   onSwipe={function (direction: number): void {
    //     console.log(direction);
    //     // throw new Error("Function not implemented.");
    //   }}
    // >
    <Card
      className={`w-full top-0 ${position} transition-all`}
      style={{
        transform: `scaleX(${scale})`,
        maxHeight: diffToCurrent !== 0 ? "200px" : "none",
        overflow: "hidden",
        zIndex,
        marginTop: `${topOffset}px`,
      }}
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
        <div className="text-sm text-muted-foreground flex flex-row gap-2 items-center">
          <span>Yields</span>
          <span>
            <Yield />
          </span>
        </div>
      </div>
      <Separator />
      <div>
        <Times
          activeTime={recipe?.activeTime}
          totalTime={recipe?.totalTime}
          cookTime={recipe?.cookTime}
        />
        {/* <SkeletonSentence className="h-4" numWords={12} /> */}
      </div>
      <Separator />
      <div className="py-2">
        <Tags />
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
            <Ingredients />
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
            <Instructions />
          </ol>
        </div>
      </div>
      {/* <Button className="w-full">
          Continue Generating <ChevronsDownIcon size={16} />
        </Button> */}
    </Card>
    // </SwipeableCard>
  );
};

export const SuggestedTokenBadge = ({
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
  const session$ = useSessionStore();
  const session = useStore(session$);
  const isGenerating = session.value.Craft.Generators.Tokens === "Generating";
  const token = session.context.suggestedTokens[index];
  // const resultId = index, session.context.suggestedIngredientssResultId);
  // console.log(index, session.context.suggestedTags);

  if (!token && !isTyping && !isGenerating) {
    return null;
  }

  if (!token || isTyping) {
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
      event={{ type: "ADD_TOKEN", token: token }}
    >
      {token}
    </Badge>
  );
};

// export const SuggestedIngredientBadge = ({
//   index,
//   className,
// }: {
//   index: number;
//   className: string;
// }) => {
//   const actor = useContext(CraftContext);
//   const isTyping = useSelector(actor, (state) =>
//     state.matches({ Typing: "True" })
//   );
//   const session = useStore(session$);
//   const isGenerating =
//     session.value.Craft.Generators.Ingredients === "Generating";
//   const ingredient = session.context.suggestedIngredients[index];
//   // const resultId = index, session.context.suggestedIngredientssResultId);
//   // console.log(index, session.context.suggestedTags);

//   if (!ingredient && !isTyping && !isGenerating) {
//     return null;
//   }

//   if (!ingredient || isTyping) {
//     return (
//       <Badge
//         className={cn(className, "carousel-item flex flex-row animate-pulse")}
//         variant="secondary"
//       >
//         <Skeleton className="w-8 h-4" />
//       </Badge>
//     );
//   }

//   return (
//     <Badge
//       className={cn(className, "carousel-item flex flex-row cursor-pointer")}
//       variant="secondary"
//       event={{ type: "ADD_TOKEN", token: ingredient }}
//     >
//       {ingredient}
//     </Badge>
//   );
// };

// export const SuggestedTagBadge = ({
//   index,
//   className,
// }: {
//   index: number;
//   className: string;
// }) => {
//   const actor = useContext(CraftContext);
//   const isTyping = useSelector(actor, (state) =>
//     state.matches({ Typing: "True" })
//   );

//   const session = useStore(session$);
//   const tag = session.context.suggestedTags[index];
//   const isGenerating = session.value.Craft.Generators.Tags === "Generating";
//   // const isGenerating = session.matches({
//   //   Craft: { Generators: { Tags: "Generating" } },
//   // });
//   // const resultId = index, session.context.suggestedIngredientssResultId);
//   // console.log(index, session.context.suggestedTags);
//   if (!tag && !isTyping && !isGenerating) {
//     return null;
//   }

//   if (!tag || isTyping) {
//     return (
//       <Badge
//         className={cn(className, "carousel-item flex flex-row animate-pulse")}
//         variant="secondary"
//       >
//         <Skeleton className="w-8 h-4" />
//       </Badge>
//     );
//   }

//   return (
//     <Badge
//       className={cn(className, "carousel-item flex flex-row cursor-pointer")}
//       variant="secondary"
//       event={{ type: "ADD_TOKEN", token: tag }}
//     >
//       {tag}
//     </Badge>
//   );
// };

const Tags = () => {
  const items = new Array(3).fill(0);

  const Tag = ({ index }: { index: number }) => {
    const session$ = useSessionStore();
    const session = useStore(session$);
    const recipeId =
      session.context.suggestedRecipes[session.context.currentItemIndex];
    if (!recipeId || !session.context.recipes[recipeId]) {
      return (
        <Badge variant="outline" className="inline-flex flex-row gap-1 px-2">
          <Skeleton className="w-8 h-4" />
        </Badge>
      );
    }
    const recipe = session.context.recipes[recipeId]!;
    const tag = recipe.tags?.[index];
    if (!tag) {
      return (
        <Badge variant="outline" className="inline-flex flex-row gap-1 px-2">
          <Skeleton className="w-8 h-4" />
        </Badge>
      );
    }
    return (
      <>
        {tag ? (
          <Link href={`/tag/${sentenceToSlug(tag)}`}>
            <Badge
              variant="outline"
              className="inline-flex flex-row gap-1 px-2"
            >
              {tag}
            </Badge>
          </Link>
        ) : null}
      </>
    );
  };

  return (
    <div className="flex flex-row flex-wrap gap-2 px-5 px-y hidden-print items-center justify-center">
      <TagIcon size={16} className="h-5" />
      {items.map((_, index) => {
        return <Tag key={index} index={index} />;
      })}
      {/* <AddTagButton /> */}
    </div>
  );
};

const Yield = () => {
  const session$ = useSessionStore();
  const session = useStore(session$);
  const recipeId =
    session.context.suggestedRecipes[session.context.currentItemIndex];
  if (!recipeId) {
    return (
      <div className="flex flex-row gap-1">
        <Skeleton className="w-4 h-4" />
        <Skeleton className="w-10 h-4" />
      </div>
    );
  }
  const val = session.context.recipes[recipeId]?.yield;
  if (!val) {
    return (
      <div className="flex flex-row gap-1">
        <Skeleton className="w-4 h-4" />
        <Skeleton className="w-10 h-4" />
      </div>
    );
  }

  return <>{val}</>;
};

const Times = ({
  cookTime,
  totalTime,
  activeTime,
}: {
  cookTime?: string;
  totalTime?: string;
  activeTime?: string;
}) => {
  // const store = useContext(RecipeViewerContext);
  // const { prepTime, cookTime, totalTime } = useStore(store, {
  //   keys: ["prepTime", "cookTime", "totalTime"],
  // });

  const ActiveTime = () => {
    return <>{formatDuration(activeTime)}</>;
  };

  const CookTime = () => {
    return <>{formatDuration(cookTime)}</>;
  };

  const TotalTime = () => {
    return <>{formatDuration(totalTime)}</>;
  };

  return (
    <div className="flex flex-row gap-2 px-5 py-2 items-center justify-center">
      <ClockIcon size={16} className="h-5" />
      <div className="flex flex-row gap-1">
        <Badge variant="secondary" className="inline-flex flex-row gap-1 px-2">
          <span className="font-normal">Cook </span>
          {cookTime ? (
            <CookTime />
          ) : (
            <Skeleton className="w-5 h-4 bg-slate-500" />
          )}
        </Badge>
        <Badge variant="secondary" className="inline-flex flex-row gap-1 px-2">
          <span className="font-normal">Active </span>
          {activeTime ? (
            <ActiveTime />
          ) : (
            <Skeleton className="w-5 h-4 bg-slate-500" />
          )}
        </Badge>
        <Badge variant="secondary" className="inline-flex flex-row gap-1 px-2">
          <span className="font-normal">Total </span>
          {totalTime ? (
            <TotalTime />
          ) : (
            <Skeleton className="w-5 h-4 bg-slate-500" />
          )}
        </Badge>
      </div>
    </div>
  );
};

function Ingredients({}) {
  const NUM_LINE_PLACEHOLDERS = 5;
  const recipe = useCurrentRecipe();
  const numIngredients = recipe?.ingredients?.length || 0;
  const currentItemIndex = useCurrentItemIndex();
  const numCompletedRecipes = useNumCompletedRecipes();
  const items = new Array(
    numCompletedRecipes < currentItemIndex + 1 && !recipe?.instructions?.length
      ? Math.max(numIngredients, NUM_LINE_PLACEHOLDERS)
      : numIngredients
  ).fill(0);

  const Item = ({ index }: { index: number }) => {
    const showPlaceholder = index < NUM_LINE_PLACEHOLDERS;
    const recipe = useCurrentRecipe();
    if (!recipe || !recipe.ingredients || !recipe.ingredients[index]) {
      return showPlaceholder ? (
        <SkeletonSentence
          className="h-7"
          numWords={Math.round(Math.random()) + 3}
        />
      ) : null;
    }

    return <li>{recipe.ingredients[index]}</li>;
  };

  return (
    <>
      {items.map((_, index) => {
        return <Item key={index} index={index} />;
      })}
    </>
  );
}

function Instructions() {
  const NUM_LINE_PLACEHOLDERS = 5;
  const recipe = useCurrentRecipe();
  const numInstructions = recipe?.instructions?.length || 0;
  const currentItemIndex = useCurrentItemIndex();
  const numCompletedRecipes = useNumCompletedRecipes();
  const items = new Array(
    numCompletedRecipes < currentItemIndex + 1
      ? Math.max(numInstructions, NUM_LINE_PLACEHOLDERS)
      : numInstructions
  ).fill(0);

  const Item = ({ index }: { index: number }) => {
    const showPlaceholder = index < NUM_LINE_PLACEHOLDERS;
    const recipe = useCurrentRecipe();
    if (!recipe || !recipe.instructions || !recipe.instructions[index]) {
      return showPlaceholder ? (
        <SkeletonSentence
          className="h-7"
          numWords={Math.round(Math.random()) + 3}
        />
      ) : null;
    }

    return <li>{recipe.instructions[index]}</li>;
  };

  return (
    <>
      {items.map((_, index) => {
        return <Item key={index} index={index} />;
      })}
    </>
  );
}

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export const EnterEmailForm = () => {
  const [disabled, setDisabled] = useState(false);
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });
  const onSubmit = useCallback(
    async (data: z.infer<typeof formSchema>) => {
      setDisabled(true);
      try {
        await signIn("email", {
          email: data.email,
          redirect: false,
        });

        const passcodeParams = new URLSearchParams({
          email: data.email,
        });

        const callbackUrl = "/me"; // todo make the pending recipe....
        passcodeParams.set("callbackUrl", callbackUrl);

        router.push(`/auth/passcode?${passcodeParams.toString()}`);
      } catch (error) {
        console.error("Sign in failed:", error);
        setDisabled(false);
      }
    },
    [router]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  autoFocus
                  autoComplete="email"
                  disabled={disabled}
                  type="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              <FormDescription>Send yourself a login code.</FormDescription>
              {fieldState.error && (
                <FormMessage>{fieldState.error.message}</FormMessage>
              )}
            </FormItem>
          )}
        />
        <Button disabled={disabled} type="submit" className="w-full" size="lg">
          {disabled ? "Loading..." : "Submit"}
        </Button>
      </form>
    </Form>
  );
};

export const ClearButton = () => {
  const session$ = useContext(SessionStoreContext);
  const session = useStore(session$);
  const disabled = buildInput(session.context).length === 0;
  return (
    <div className="flex flex-row justify-center pointer-events-none">
      <Button
        event={{ type: "CLEAR", all: true }}
        size="lg"
        className="pointer-events-auto px-3 py-2 cursor-pointer"
        variant="outline"
        disabled={disabled}
      >
         Clear
      </Button>
    </div>
  );
};

export const UndoButton = () => {
  const session$ = useContext(SessionStoreContext);
  const session = useStore(session$);
  const disabled = session.context.undoOperations.length === 0;

  return (
    <div className="flex flex-row justify-center pointer-events-none">
      <Button
        event={{ type: "UNDO" }}
        size="lg"
        className="pointer-events-auto px-3 py-2 cursor-pointer"
        variant="outline"
        disabled={disabled}
      >
        Undo
      </Button>
    </div>
  );
};
