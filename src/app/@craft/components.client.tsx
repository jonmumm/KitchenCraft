"use client";

import { Badge } from "@/components/display/badge";
import { Card, CardDescription, CardTitle } from "@/components/display/card";
import { Separator } from "@/components/display/separator";
import { Skeleton, SkeletonSentence } from "@/components/display/skeleton";
import { Input } from "@/components/input";
import { Button } from "@/components/input/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/input/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/input/form";
import { PopoverContent, PopoverTrigger } from "@/components/layout/popover";
import { useEventHandler } from "@/hooks/useEventHandler";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { assert, cn, formatDuration, sentenceToSlug } from "@/lib/utils";
import { RecipeCraftingPlaceholder } from "@/modules/recipe/crafting-placeholder";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStore } from "@nanostores/react";
import { Popover } from "@radix-ui/react-popover";
import {
  ClockIcon,
  HeartIcon,
  LockIcon,
  MoveLeftIcon,
  PrinterIcon,
  ScrollIcon,
  ShoppingBasketIcon,
  TagIcon,
  XIcon,
} from "lucide-react";
import { WritableAtom } from "nanostores";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useForm } from "react-hook-form";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import { z } from "zod";
import { CraftContext } from "../context";
import { SessionStoreContext } from "../page-session-store.context";
import { ShareButton } from "../recipe/components.client";
import { buildInput, isEqual } from "../utils";
import { CommandInput } from "@/components/input/command.primitive";
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
  const promptLength = usePromptLength();
  const numTokens = useNumTokens();

  return !numTokens && promptLength === 0 ? <>{children}</> : null;
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
  const promptLength = usePromptLength();

  return promptLength === 0 ? <>{children}</> : null;
};
export const CraftPromptNotEmpty = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const promptLength = usePromptLength();

  return promptLength !== 0 ? <>{children}</> : null;
};

export const HasTokens = ({ children }: { children: ReactNode }) => {
  const numTokens = useNumTokens();

  return numTokens !== 0 ? <>{children}</> : null;
};

export const CraftNotOpen = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const saving = useSelector(
    actor,
    (state) => !state.matches({ Open: "False" })
  );

  return !saving ? <>{children}</> : null;
};

export const CraftNotEmpty = ({ children }: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const promptLength = usePromptLength();
  const numTokens = useNumTokens();

  return numTokens || promptLength !== 0 ? <>{children}</> : null;
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
  const numCards = useNumCards();
  const items = new Array(numCards).fill(numCards);

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

const usePromptLength = () => {
  const session = useSessionStore();
  const [length, setLength] = useState(session.get().context.prompt.length);
  useEventHandler("SET_INPUT", ({ value }) => setLength(value.length));
  return length;
};

const useNumTokens = () => {
  const session$ = useSessionStore();

  return useSyncExternalStoreWithSelector(
    session$.subscribe,
    () => {
      return session$.get().context.tokens;
    },
    () => {
      return session$.get().context.tokens;
    },
    (tokens) => tokens.length
  );
};

const useTokens = () => {
  const session$ = useSessionStore();

  // return session$.get().context.tokens;
  return useSyncExternalStoreWithSelector(
    session$.subscribe,
    () => {
      return session$.get().context;
    },
    () => session$.get().context,
    ({ tokens }) => {
      return tokens;
    },
    isEqual
  );
  // const { context } = useStore(session$);

  // console.log("use tokens");
  // return context.tokens;
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

const useSuggestedRecipeSlugAtIndex = (index: number) => {
  const session$ = useSessionStore();
  return useSyncExternalStoreWithSelector(
    session$.subscribe,
    () => {
      return session$.get().context;
    },
    () => {
      return session$.get().context;
    },
    (context) => {
      const recipeId = context.suggestedRecipes[index];
      return !!recipeId ? context.recipes[recipeId]?.slug : undefined;
    }
  );
};

const useCurrentRecipeSlug = () => {
  const session$ = useSessionStore();
  return useSyncExternalStoreWithSelector(
    session$.subscribe,
    () => {
      return session$.get().context;
    },
    () => {
      return session$.get().context;
    },
    (context) => {
      const recipeId = context.suggestedRecipes[context.currentItemIndex];

      return !!recipeId ? context.recipes[recipeId]?.slug : undefined;
    }
  );
};

const useNumCards = () => {
  const session$ = useSessionStore();
  return useSyncExternalStoreWithSelector(
    session$.subscribe,
    () => {
      return session$.get().context;
    },
    () => {
      return session$.get().context;
    },
    (context) => context.suggestedRecipes.length
  );
};

// const useScrollItemIndex = () => {
//   const actor = useContext(CraftContext);

//   // Subscribe function that listens to changes from the actor
//   const subscribe = (onStoreChange: () => void) => {
//     const { unsubscribe } = actor.subscribe(onStoreChange);
//     return unsubscribe;
//   };

//   // Snapshot function to get the current state context
//   const getSnapshot = () => actor.getSnapshot().context;

//   // Selector function to extract scrollItemIndex from the context
//   const selector = (context: ReturnType<typeof getSnapshot>) =>
//     context.scrollItemIndex;

//   return useSyncExternalStoreWithSelector(
//     subscribe,
//     getSnapshot,
//     getSnapshot, // Using getSnapshot for the selector as well
//     selector
//   );
// };

const useCurrentItemIndex = () => {
  const session$ = useSessionStore();
  return useSyncExternalStoreWithSelector(
    session$.subscribe,
    () => {
      return session$.get().context;
    },
    () => {
      return session$.get().context;
    },
    (context) => context.currentItemIndex
  );
};

const useRecipeAtIndex = (index: number) => {
  const session$ = useSessionStore();
  return useSyncExternalStoreWithSelector(
    session$.subscribe,
    () => {
      return session$.get().context;
    },
    () => {
      return session$.get().context;
    },
    (context) => {
      const id = context.suggestedRecipes[index];
      if (!id) {
        return undefined;
      }
      const recipe = context.recipes[id];
      return recipe;
    }
  );

  // const session = useStore(session$);
  // // const recipeId =
  // //   session.context.suggestedRecipes[session.context.currentItemIndex];
  // // if (!recipeId) {
  // //   return null;
  // // }
  // // const recipe = session.context.recipes[recipeId];
  // // if (!recipe) {
  // //   return null;
  // // }
  // const recipeId =
  //   session.context.suggestedRecipes[session.context.currentItemIndex];
  // if (!recipeId) {
  //   return null;
  // }

  // const recipe = recipeId ? session.context.recipes[recipeId] : undefined;
  // return recipe;
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
  const recipe = useRecipeAtIndex(index);

  return (
    <Card className="carousel-item w-[90vw] md:w-4/5 relative flex flex-col">
      <div className="flex flex-col p-4">
        <div className="flex flex-row gap-1 w-full">
          <div className="flex flex-col gap-2 w-full">
            <CardTitle className="flex flex-row items-center gap-2">
              {index + 1}.{" "}
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
          </div>
          <div className="flex flex-col gap-1 items-center">
            <SaveButton slug={recipe?.slug} />
            <ShareButton
              slug={recipe?.slug}
              name={recipe?.name!}
              description={recipe?.description!}
            />
            <PrintButton slug={recipe?.slug} />
          </div>
        </div>
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
      <div className="px-5">
        <div className="flex flex-row justify-between gap-1 items-center py-4">
          <h3 className="uppercase text-xs font-bold text-accent-foreground">
            Ingredients
          </h3>
          <ShoppingBasketIcon />
        </div>
        <div className="mb-4 flex flex-col gap-2">
          <ul className="list-disc pl-5 flex flex-col gap-2">
            <Ingredients index={index} />
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
            <Instructions index={index} />
          </ol>
        </div>
      </div>
      <Separator />
      <div className="py-2">
        <Tags index={index} />
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

const Tags = ({ index }: { index: number }) => {
  const items = new Array(3).fill(0);

  const Tag = (props: { index: number }) => {
    const session$ = useSessionStore();
    const session = useStore(session$);
    const recipeId = session.context.suggestedRecipes[index];
    if (!recipeId || !session.context.recipes[recipeId]) {
      return (
        <Badge variant="outline" className="inline-flex flex-row gap-1 px-2">
          <Skeleton className="w-8 h-4" />
        </Badge>
      );
    }
    const recipe = session.context.recipes[recipeId]!;
    const tag = recipe.tags?.[props.index];
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
      {items.map((_, ind) => {
        return <Tag key={ind} index={ind} />;
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

function Ingredients({ index }: { index: number }) {
  const NUM_LINE_PLACEHOLDERS = 5;
  const recipe = useRecipeAtIndex(index);
  const numIngredients = recipe?.ingredients?.length || 0;
  const numCompletedRecipes = useNumCompletedRecipes();
  const items = new Array(
    numCompletedRecipes < index + 1 && !recipe?.instructions?.length
      ? Math.max(numIngredients, NUM_LINE_PLACEHOLDERS)
      : numIngredients
  ).fill(0);

  const Item = (props: { index: number }) => {
    const showPlaceholder = props.index < NUM_LINE_PLACEHOLDERS;
    const recipe = useRecipeAtIndex(index);
    if (!recipe || !recipe.ingredients || !recipe.ingredients[props.index]) {
      return showPlaceholder ? (
        <SkeletonSentence
          className="h-7"
          numWords={Math.round(Math.random()) + 3}
        />
      ) : null;
    }

    return <li>{recipe.ingredients[props.index]}</li>;
  };

  return (
    <>
      {items.map((_, index) => {
        return <Item key={index} index={index} />;
      })}
    </>
  );
}

function Instructions({ index }: { index: number }) {
  const NUM_LINE_PLACEHOLDERS = 5;
  const recipe = useRecipeAtIndex(index);
  const numInstructions = recipe?.instructions?.length || 0;
  const numCompletedRecipes = useNumCompletedRecipes();
  const items = new Array(
    numCompletedRecipes < index + 1
      ? Math.max(numInstructions, NUM_LINE_PLACEHOLDERS)
      : numInstructions
  ).fill(0);

  const Item = (props: { index: number }) => {
    const showPlaceholder = props.index < NUM_LINE_PLACEHOLDERS;
    const recipe = useRecipeAtIndex(index);
    if (!recipe || !recipe.instructions || !recipe.instructions[props.index]) {
      return showPlaceholder ? (
        <SkeletonSentence
          className="h-7"
          numWords={Math.round(Math.random()) + 3}
        />
      ) : null;
    }

    return <li>{recipe.instructions[props.index]}</li>;
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
  const session$ = useContext(SessionStoreContext);
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

        const context = session$.get().context;
        const currentRecipeId =
          context.suggestedRecipes[context.currentItemIndex];
        assert(currentRecipeId, "expected currentRecipeId");
        const recipe = context.recipes[currentRecipeId];

        const slug = recipe?.slug;
        assert(slug, "expected recipe slug");

        const callbackUrl = `/recipe/${slug}`;
        // session$
        passcodeParams.set("callbackUrl", callbackUrl);

        router.push(`/auth/passcode?${passcodeParams.toString()}`);
      } catch (error) {
        console.error("Sign in failed:", error);
        setDisabled(false);
      }
    },
    [router, session$]
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

export const PrevButton = () => {
  // const index = use
  // const index = useCur
  const index = useCurrentItemIndex();
  return (
    <div
      className={cn(
        "flex-row justify-center pointer-events-none",
        index ? "flex" : "invisible"
      )}
    >
      {index && (
        <Button
          event={{ type: "PREV" }}
          size="lg"
          className="pointer-events-auto px-3 py-2 cursor-pointer shadow-xl rounded-full"
        >
          <MoveLeftIcon size={32} />
        </Button>
      )}
    </div>
  );
};

interface WaitForOptions {
  timeout?: number;
}

export function waitFor<T>(
  store: WritableAtom<T>,
  predicate: (state: T) => boolean,
  options: WaitForOptions = {}
) {
  const { timeout = 10000 } = options;

  return new Promise<void>((resolve, reject) => {
    // let unsubscribe;

    // Function to clean up listeners and timeout
    // const cleanUp = () => {
    //   clearTimeout(timeoutHandle);
    //   unsubscribe();
    // };

    // Check if the current state already satisfies the predicate
    if (predicate(store.get())) {
      resolve();
      return;
    }
    let timeoutHandle: NodeJS.Timeout | undefined;

    // Subscribe to store changes
    const unsubscribe = store.listen((state) => {
      if (predicate(state)) {
        resolve();
        unsubscribe();
        clearTimeout(timeoutHandle);
      }
    });

    // Set up a timeout to reject the promise if condition is not met within the timeout period
    timeoutHandle = setTimeout(() => {
      unsubscribe();
      reject(
        new Error(
          `Timeout of ${timeout} ms exceeded without meeting the condition.`
        )
      );
    }, timeout);
  });
}

const PrintButton = ({ slug }: { slug?: string }) => {
  return (
    <div className="flex flex-row justify-center w-full">
      {slug ? (
        <Button variant="outline" event={{ type: "PRINT" }}>
          <PrinterIcon />
        </Button>
      ) : (
        <Button variant="outline" disabled>
          <PrinterIcon className="animate-pulse" />
        </Button>
      )}
    </div>
  );
};

const SaveButton = ({ slug }: { slug?: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-row justify-center w-full">
      {slug ? (
        // <Button event={{ type: "SAVE" }}>
        //   <HeartIcon />
        // </Button>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
            // size="sm"
            // className="w-[150px] justify-start"
            >
              <HeartIcon className="opacity-50" />
              {/* {selectedStatus ? (
                <>
                  <selectedStatus.icon className="mr-2 h-4 w-4 shrink-0" />
                  {selectedStatus.label}
                </>
              ) : (
                <>+ Set status</>
              )} */}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" side="right" align="start">
            <Command defaultValue={""}>
              <CommandList>
                {/* <SaveCommandEmpty /> */}

                <CommandGroup heading="Public Lists (1/1)">
                  <CommandItem
                    value={"My Recipes"}
                    // onSelect={(value) => {
                    //   // setSelectedStatus(
                    //   //   statuses.find(
                    //   //     (priority) => priority.value === value
                    //   //   ) || null
                    //   // );
                    //   setOpen(false);
                    // }}
                  >
                    My Recipes
                  </CommandItem>
                  <CommandItem
                    value={"Create New Public"}
                    // onSelect={(value) => {
                    //   // setSelectedStatus(
                    //   //   statuses.find(
                    //   //     (priority) => priority.value === value
                    //   //   ) || null
                    //   // );
                    //   setOpen(false);
                    // }}
                  >
                    Create Public List
                  </CommandItem>
                </CommandGroup>
                <CommandGroup
                  heading={
                    <div className="flex flex-row gap-1">
                      <span>Shared Group Lists (0/0)</span>
                      <LockIcon size={14} />
                    </div>
                  }
                >
                  <CommandItem
                    value={"Create New SHraed"}
                    // onSelect={(value) => {
                    //   // setSelectedStatus(
                    //   //   statuses.find(
                    //   //     (priority) => priority.value === value
                    //   //   ) || null
                    //   // );
                    //   setOpen(false);
                    // }}
                  >
                    Create Shared List
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : (
        <Button disabled>
          <HeartIcon className="animate-pulse" />
        </Button>
      )}
    </div>
  );
};

// const ShareButton = ({ slug }: { slug?: string }) => {
//   return (
//     <>
//       {slug ? (
//         <Button variant="outline" event={{ type: "SHARE", slug }}>
//           <ShareIcon />
//         </Button>
//       ) : (
//         <Button variant="outline" disabled>
//           <Loader2Icon className="animate-spin" />
//         </Button>
//       )}
//     </>
//   );
// };

export const CraftCarousel = ({ children }: { children: ReactNode }) => {
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const actor = useContext(CraftContext);
  const scrollItemIndex = useSelector(
    actor,
    (state) => state.context.scrollItemIndex
  );
  // const scrollItemIndex = useScrollItemIndex();
  console.log({ scrollItemIndex });
  const indexRef = useRef(scrollItemIndex);

  const send = useSend();

  useEffect(() => {
    if (scrollItemIndex !== indexRef.current) {
      // scrollItemIndex was updated from elsewhere, update internally and then scroll to it
      const carousel = carouselRef.current;
      if (!carousel) {
        return;
      }
      // scrollItemIndex was updated from elsewhere, update internally and then scroll to it
      indexRef.current = scrollItemIndex;
      const targetItem = carousel.children[scrollItemIndex];
      if (targetItem) {
        const targetScrollPosition = targetItem.clientWidth * scrollItemIndex;
        console.log({ targetScrollPosition }, carousel);
        carousel.scrollLeft = targetScrollPosition;
      }
    }
  }, [scrollItemIndex]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    // Function to handle scroll event
    const handleScroll = () => {
      const child = carousel.children[0];
      if (!child) {
        return;
      }
      const itemWidth = child.clientWidth;
      const newIndex = Math.round(carousel.scrollLeft / itemWidth);
      if (newIndex !== indexRef.current) {
        indexRef.current = newIndex;
        send({ type: "SCROLL_INDEX", index: newIndex });
      }
    };

    // Attach the scroll event listener
    carousel.addEventListener("scroll", handleScroll);

    // Clean up function to remove event listener
    return () => {
      carousel.removeEventListener("scroll", handleScroll);
    };
  }, [send, actor]);

  return (
    <div
      ref={carouselRef}
      className="carousel pl-4 carousel-center md:pl-[20%] space-x-2"
    >
      {children}
    </div>
  );
};

const SaveCommandEmpty = () => {
  return <CommandEmpty>Create New</CommandEmpty>;
};
