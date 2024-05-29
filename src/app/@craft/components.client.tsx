"use client";

import { Badge } from "@/components/display/badge";
import { Card, CardDescription, CardTitle } from "@/components/display/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/display/collapsible";
import { Separator } from "@/components/display/separator";
import { Skeleton, SkeletonSentence } from "@/components/display/skeleton";
import { Ingredients } from "@/components/ingredients";
import { Input } from "@/components/input";
import { Button } from "@/components/input/button";
import EventTrigger from "@/components/input/event-trigger";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/input/form";
import { Instructions } from "@/components/instructions";
import { PopoverContent, PopoverTrigger } from "@/components/layout/popover";
import ScrollLockComponent from "@/components/scroll-lock";
import { Tags } from "@/components/tags";
import { Times } from "@/components/times";
import { Yield } from "@/components/yield";
import { useEventHandler } from "@/hooks/useEventHandler";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { useSuggestedRecipeAtIndex } from "@/hooks/useSuggestedRecipeAtIndex";
import { openAndPrintURL } from "@/lib/print";
import { assert, cn, sentenceToSlug } from "@/lib/utils";
import { RecipeCraftingPlaceholder } from "@/modules/recipe/crafting-placeholder";
import { ChefNameSchema, ListNameSchema } from "@/schema";
import { ExtractAppEvent } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStore } from "@nanostores/react";
import { Label } from "@radix-ui/react-label";
import { Popover } from "@radix-ui/react-popover";
import { Portal } from "@radix-ui/react-portal";
import {
  CarrotIcon,
  CheckCircle2Icon,
  CheckIcon,
  CircleSlash2Icon,
  ExpandIcon,
  ExternalLinkIcon,
  Loader2Icon,
  MoveLeftIcon,
  PlusIcon,
  PrinterIcon,
  ScrollIcon,
  ShareIcon,
  ShoppingBasketIcon,
  TagIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react";
import { WritableAtom } from "nanostores";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FC,
  ReactNode,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { twc } from "react-twc";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import { z } from "zod";
import { RecipeDetailOverlay } from "../components.client";
import { CraftContext } from "../context";
import { CraftSnapshot } from "../machine";
import { PageSessionSnapshot } from "../page-session-machine";
import { SessionStoreSnapshot } from "../page-session-store-provider";
import { PageSessionContext } from "../page-session-store.context";
import { buildInput, isEqual } from "../utils";
import { useCraftContext } from "./hooks";
import { ShareButton } from "@/components/share-button";
import { PrintButton } from "@/components/print-button";
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
  const promptLength = usePromptLength();
  return promptLength !== 0 ? <>{children}</> : null;
};

// const selectIsShowingAddedRecipe = (state: CraftSnapshot) =>
//   state.matches({ Auth: { LoggedIn: { Adding: { False: "Added" } } } });

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
  const items = new Array(numCards).fill(0);

  return (
    <>
      {items.map((_, index) => {
        return <SuggestedRecipeCard key={index} index={index} />;
      })}
    </>
  );
};

export const LoadMoreCard = () => {
  return (
    <Card
      eventOnView={{ type: "LOAD_MORE" }}
      className="flex items-center justify-center cursor-pointer w-full p-8 mx-4"
    >
      Load More
    </Card>
  );
};

const usePromptLength = () => {
  const actor = useContext(CraftContext);
  const promptLength = useSelector(
    actor,
    (state) => state.context.prompt.length
  );
  return promptLength;
};

const useNumTokens = () => {
  const session$ = usePageSessionStore();

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
  const session$ = usePageSessionStore();

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

const useNumCards = () => {
  const session$ = usePageSessionStore();
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

const useChefName = () => {
  const session$ = usePageSessionStore();
  return useSyncExternalStoreWithSelector(
    session$.subscribe,
    () => {
      return session$.get().context.chefname;
    },
    () => {
      return session$.get().context.chefname;
    },
    (chefname) => chefname
  );
};

const useCurrentItemIndex = () => {
  const session$ = usePageSessionStore();
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

const useCurrentRecipe = () => {
  const session$ = usePageSessionStore();
  const session = useStore(session$);
  const recipeId =
    session.context.suggestedRecipes[session.context.currentItemIndex];
  if (!recipeId) {
    return null;
  }

  const recipe = recipeId ? session.context.recipes[recipeId] : undefined;
  return recipe;
};

export const SuggestedRecipeCard = ({ index }: { index: number }) => {
  const recipe = useSuggestedRecipeAtIndex(index);

  const actor = useCraftContext();
  const selectIsFocused = useCallback(
    (state: CraftSnapshot) => {
      return !!recipe?.id && state.context.focusedRecipeId === recipe.id;
    },
    [recipe?.id]
  );
  const isFocused = useSelector(actor, selectIsFocused);
  const isExpanded = isFocused;
  const send = useSend();
  const isSelected = usePageSessionSelector(
    (state) =>
      recipe?.id &&
      state.context.browserSessionSnapshot?.context.selectedRecipeIds.includes(
        recipe.id!
      )
  );

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (value && recipe?.id) {
        send({ type: "VIEW_RECIPE", id: recipe.id });
      }
    },
    [send, recipe?.id]
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
            : ""
        )}
      >
        <EventTrigger
          event={{ type: "VIEW_RECIPE", id: recipe?.id! }}
          disabled={isExpanded}
          className={cn(
            "flex flex-col p-4",
            recipe?.id ? "cursor-pointer" : ""
          )}
        >
          <div className="flex flex-row gap-2 w-full">
            <div className="flex flex-col gap-2 w-full">
              <CardTitle className="flex flex-row items-center gap-2">
                <span className="text-muted-foreground">{index + 1}.{" "}</span>
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
                  <Button
                    size="icon"
                    variant="ghost"
                    autoFocus={false}
                    disabled
                  >
                    <ExternalLinkIcon />
                  </Button>
                )}
              </div>
            )}
            {!isExpanded && recipe?.id && recipe.name && (
              <div className="flex flex-col justify-center">
                <Button
                  size="icon"
                  variant="outline"
                  event={{ type: "VIEW_RECIPE", id: recipe.id }}
                >
                  <ExpandIcon />
                </Button>
              </div>
            )}
          </div>
        </EventTrigger>
        <Separator />
        <Collapsible
          open={isFocused}
          className="overflow-hidden"
          onOpenChange={handleOpenChange}
        >
          {!isExpanded && (
            <CollapsibleTrigger asChild disabled={!recipe?.name}>
              <div className="flex flex-row gap-1 items-center justify-center text-s py-3 cursor-pointer">
                {recipe?.id && recipe.name ? (
                  !isSelected ? (
                    <Badge
                      variant="secondary"
                      event={{ type: "SELECT_RECIPE", id: recipe.id }}
                    >
                      Select <CheckIcon className="ml-1" size={14} />
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      event={{ type: "UNSELECT", id: recipe.id }}
                    >
                      Unselect <CircleSlash2Icon className="ml-1" size={14} />
                    </Badge>
                  )
                ) : (
                  <Badge variant="secondary">
                    <span className="text-muted-foreground flex flex-row gap-1">
                      <span>Generating</span>
                      <Loader2Icon size={16} className="animate-spin" />
                    </span>
                  </Badge>
                )}
              </div>
            </CollapsibleTrigger>
          )}
          <CollapsibleContent>
            {isExpanded && recipe?.metadataComplete && (
              <div className="flex flex-row gap-2 p-2 max-w-xl mx-auto justify-center">
                <ShareButton slug={recipe.slug} name={recipe.name} />
                {!isSelected ? (
                  <Button
                    size="icon"
                    className="flex-1 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white"
                    event={{ type: "SELECT_RECIPE", id: recipe.id }}
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
          <Badge event={{ type: "EXIT" }}>
            Close <XIcon size={14} className="ml-1" />
          </Badge>
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
  const actor = useCraftContext();
  const selectIsFocused = useCallback(
    (state: CraftSnapshot) => {
      return !!recipe?.id && state.context.focusedRecipeId === recipe.id;
    },
    [recipe?.id]
  );
  const isFocused = useSelector(actor, selectIsFocused);
  return (
    <div
      style={isFocused ? { zIndex: 65 } : {}}
      className={cn(isFocused ? "absolute inset-0 mb-16" : "max-w-xl w-full")}
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
  const session$ = usePageSessionStore();
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

const chefNameFormSchema = z.object({
  chefname: ChefNameSchema,
});

const listNameFormSchema = z.object({
  listName: ListNameSchema,
});

const emailFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export const EnterEmailForm = () => {
  const [disabled, setDisabled] = useState(false);
  const router = useRouter();
  const session$ = useContext(PageSessionContext);
  const form = useForm({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
    },
  });
  const send = useSend();

  useEffect(() => {
    return form.watch((data) => {
      const value = data.email || "";
      send({ type: "CHANGE", name: "email", value });
    }).unsubscribe;
  }, [form.watch, send]);

  const onSubmit = useCallback(
    async (data: z.infer<typeof emailFormSchema>) => {
      setDisabled(true);
      try {
        send({ type: "SUBMIT" });
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

const selectIsLoadingChefNameAvailability = (snapshot: PageSessionSnapshot) => {
  const stateValue = snapshot.value;
  return (
    typeof stateValue === "object" &&
    !!stateValue.Profile &&
    typeof stateValue.Profile === "object" &&
    (stateValue.Profile.Available === "Loading" ||
      stateValue.Profile.Available === "Holding")
  );
};

const selectSelectedList = (snapshot: PageSessionSnapshot) => {
  if (snapshot.context.listsBySlug && snapshot.context.currentListSlug) {
    return snapshot.context.listsBySlug[snapshot.context.currentListSlug];
  }
  return undefined;
};

const selectIsChefNameAvailable = (snapshot: PageSessionSnapshot) => {
  const stateValue = snapshot.value;
  return (
    typeof stateValue === "object" &&
    !!stateValue.Profile &&
    typeof stateValue.Profile === "object" &&
    stateValue.Profile.Available === "Yes"
  );
};

const selectIsChefNameInputPristine = (snapshot: PageSessionSnapshot) => {
  const stateValue = snapshot.value;
  return (
    typeof stateValue === "object" &&
    !!stateValue.Profile &&
    typeof stateValue.Profile === "object" &&
    stateValue.Profile.Available === "Uninitialized"
  );
};

export const EnterChefNameForm = () => {
  // const [disabled, setDisabled] = useState(false);
  const session$ = useContext(PageSessionContext);
  const isLoadingAvailability = useSyncExternalStore(
    session$.subscribe,
    () => {
      return selectIsLoadingChefNameAvailability(session$.get());
    },
    () => {
      return false;
    }
  );
  const isPristine = useSyncExternalStore(
    session$.subscribe,
    () => {
      return selectIsChefNameInputPristine(session$.get());
    },
    () => {
      return false;
    }
  );
  const isAvailable = useSyncExternalStore(
    session$.subscribe,
    () => {
      return selectIsChefNameAvailable(session$.get());
    },
    () => {
      return false;
    }
  );
  const [disabled, setDisabled] = useState(false);
  const send = useSend();

  const form = useForm({
    resolver: zodResolver(chefNameFormSchema),
    defaultValues: {
      chefname: "",
    },
  });

  useEventHandler("SELECT_VALUE", (event) => {
    if (event.name === "suggested_chefname") {
      form.setValue("chefname", event.value);
    }
    return;
  });

  useEffect(() => {
    return form.watch((data) => {
      const value = data.chefname || "";
      send({ type: "CHANGE", name: "chefname", value });
    }).unsubscribe;
  }, [form.watch, send]);

  // useEffect(() => {
  //   return form.watch("chefname")

  // }, [form.watch])

  // todo how do i call  this on chefname change
  // send({ type: "CHANGE", name: "chefname", value: data.chefname });
  const onSubmit = useCallback(
    async (data: z.infer<typeof chefNameFormSchema>) => {
      setDisabled(true);
      send({ type: "SUBMIT" });
    },
    [session$, send]
  );

  // const FormValueSender = () => {
  //   const field = useFormField();
  //   console.log({ field });
  //   return <></>;
  // };

  const TakenChefName = () => {
    const chefname = useChefName();

    return <>{chefname} Taken</>;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="chefname"
          render={({ field, fieldState }) => (
            <FormItem>
              {/* <FormValueSender /> */}
              <FormLabel>Chef Name</FormLabel>
              <FormControl>
                <PlaceholderAnimatingInput
                  samplePlaceholders={[
                    "chefJoe123",
                    "amyCooks88",
                    "bbqBob202",
                    "LisaFoodie",
                    "mikemaster7",
                    "sambaker007",
                    "VicVegan303",
                    "patPatty",
                    "grillGal555",
                    "guyPie404",
                  ]}
                  autoFocus
                  disabled={disabled}
                  type="text"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                You recipes will be saved to:
                <br /> kitchencraft.ai/@
                <ChefNamePath />
              </FormDescription>
              {fieldState.error && (
                <FormMessage>{fieldState.error.message}</FormMessage>
              )}
            </FormItem>
          )}
        />
        <Button
          disabled={disabled || !isAvailable}
          type="submit"
          className={cn("w-full", isAvailable ? "bg-blue-500 text-white" : "")}
          size="lg"
        >
          {disabled ? (
            "Loading..."
          ) : isAvailable ? (
            "Available! Submit"
          ) : isLoadingAvailability ? (
            "Checking..."
          ) : isPristine ? (
            "Submit"
          ) : (
            <TakenChefName />
          )}
        </Button>
      </form>
    </Form>
  );
};

export const EnterListNameForm = () => {
  const session$ = useContext(PageSessionContext);
  const [disabled, setDisabled] = useState(false);
  const send = useSend();

  const form = useForm({
    resolver: zodResolver(listNameFormSchema),
    defaultValues: {
      listName: "",
    },
  });

  useEffect(() => {
    return form.watch((data) => {
      const value = data.listName || "";
      send({ type: "CHANGE", name: "listName", value });
    }).unsubscribe;
  }, [form.watch, send]);

  const onSubmit = useCallback(
    async (data: z.infer<typeof listNameFormSchema>) => {
      setDisabled(true);
      send({ type: "SUBMIT" });
    },
    [session$, send]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="listName"
          render={({ field, fieldState }) => (
            <FormItem>
              {/* <FormValueSender /> */}
              <FormLabel>Name</FormLabel>
              <FormControl>
                <PlaceholderAnimatingInput
                  samplePlaceholders={[
                    "tuesday night dinner ideas",
                    "weekend bbq dishes",
                    "healthy work snacks",
                    "birthday cake ideas",
                    "kids friendly meal prep",
                    "easy 20 minute meals",
                  ]}
                  autoFocus
                  disabled={disabled}
                  type="text"
                  {...field}
                />
              </FormControl>
              {fieldState.error && (
                <FormMessage>{fieldState.error.message}</FormMessage>
              )}
            </FormItem>
          )}
        />
        <Button
          disabled={disabled}
          type="submit"
          className={cn("w-full")}
          size="lg"
        >
          Submit
        </Button>
      </form>
    </Form>
  );
};

const ListURL = () => {
  const chefname = useChefName();
  const listName = useWatch({ name: "listName" });

  const ListNamePath = () => {
    return (
      <span className="font-semibold">
        {listName === "" ? "]" : sentenceToSlug(listName)}
      </span>
    );
  };

  return listName.length ? (
    <FormDescription>
      kitchencraft.ai/@{chefname}/
      <ListNamePath />
    </FormDescription>
  ) : (
    <></>
  );
};

const ChefNamePath = () => {
  const chefname = useWatch({ name: "chefname" });

  return (
    <span className="font-semibold">
      {chefname === "" ? "YOUR-CHEF-NAME" : chefname}
    </span>
  );
};

type PlaceholderAnimatingInputProps = {
  samplePlaceholders: string[];
} & React.ComponentProps<typeof Input>;

const PlaceholderAnimatingInput = forwardRef<
  HTMLInputElement,
  PlaceholderAnimatingInputProps
>(({ samplePlaceholders, ...inputProps }, ref) => {
  const localInputRef = useRef<HTMLInputElement>(null);
  const typing = useRef(true);
  const placeholderText = useRef("");
  const placeholderIndex = useRef(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connect the local ref with the forwarded ref
  useImperativeHandle(ref, () => localInputRef.current!);

  useEffect(() => {
    const updatePlaceholder = () => {
      const currentPlaceholder = samplePlaceholders[placeholderIndex.current];
      if (typing.current) {
        assert(currentPlaceholder, "expected at least one samplePlaceholder");
        if (placeholderText.current.length < currentPlaceholder.length) {
          placeholderText.current = currentPlaceholder.slice(
            0,
            placeholderText.current.length + 1
          );
          if (localInputRef.current) {
            localInputRef.current.placeholder = placeholderText.current;
          }
        } else {
          if (!typingTimeoutRef.current) {
            typingTimeoutRef.current = setTimeout(() => {
              typing.current = false;
              updatePlaceholder(); // Begin deleting after a pause
            }, 1000); // Pause before starting to delete
          }
        }
      } else {
        if (placeholderText.current.length > 0) {
          placeholderText.current = placeholderText.current.slice(0, -1);
          if (localInputRef.current) {
            localInputRef.current.placeholder = placeholderText.current;
          }
        } else {
          typing.current = true;
          placeholderIndex.current =
            (placeholderIndex.current + 1) % samplePlaceholders.length;
          clearTimeout(typingTimeoutRef.current!);
          typingTimeoutRef.current = null;
          updatePlaceholder(); // Reset to type the next placeholder
        }
      }
    };

    const intervalId = setInterval(updatePlaceholder, 100);
    return () => {
      clearInterval(intervalId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [samplePlaceholders]);

  return <Input ref={localInputRef} {...inputProps} />;
});
PlaceholderAnimatingInput.displayName = "PlaceholderAnimatingInput";

export const ClearButton = () => {
  const session$ = useContext(PageSessionContext);
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
  const session$ = useContext(PageSessionContext);
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

// export const GoToButton = () => {
//   // const index = use
//   // const index = useCur
//   const index = useCurrentItemIndex();
//   return (
//     <div
//       className={cn(
//         "flex-row justify-center pointer-events-none",
//         index ? "flex" : "invisible"
//       )}
//     >
//       {index && (
//         <Button
//           event={{ type: "PREV" }}
//           size="lg"
//           className="pointer-events-auto px-3 py-2 cursor-pointer shadow-xl rounded-full flex flex-row gap-1 items-center"
//           variant="secondary"
//         >
//           <span>Open Recipe</span>
//           <ExternalLinkIcon size={15} />
//         </Button>
//       )}
//     </div>
//   );
// };

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

// const PrintButton = ({ slug }: { slug?: string }) => {
//   return (
//     <div className="flex flex-row justify-center w-full">
//       {slug ? (
//         <Button variant="outline" event={{ type: "PRINT" }}>
//           <PrinterIcon />
//         </Button>
//       ) : (
//         <Button variant="outline" disabled>
//           <PrinterIcon className="animate-pulse" />
//         </Button>
//       )}
//     </div>
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

export const Container = twc.div`flex flex-col gap-2 h-full mx-auto w-full`;
export const Section = twc.div`flex flex-col gap-1`;
interface SectionLabelProps {
  icon: React.ElementType; // This type is used for components passed as props
  title: string;
}

export const SectionLabel: FC<SectionLabelProps> = ({ icon: Icon, title }) => {
  return (
    <Label className="text-xs text-muted-foreground uppercase font-semibold px-4 flex flex-row gap-1">
      <Icon size={14} />
      {title}
    </Label>
  );
};

export const BadgeList = ({ children }: { children: ReactNode }) => {
  return <div className="px-4 flex flex-row gap-2 flex-wrap">{children}</div>;
};

const selectSuggestedIngredients = (snapshot: SessionStoreSnapshot) => {
  return (
    snapshot.context.browserSessionSnapshot?.context.suggestedIngredients || []
  );
};

const IngredientsLabel = () => {
  return <SectionLabel icon={CarrotIcon} title={"Ingredients"} />;
};

export const SuggestedIngredientsSection = () => {
  const items = new Array(20).fill(0);
  const session$ = usePageSessionStore();
  const ingredients = useSyncExternalStore(
    session$.subscribe,
    () => selectSuggestedIngredients(session$.get()),
    () => selectSuggestedIngredients(session$.get())
  );
  const isGenerating = useSyncExternalStore(
    session$.subscribe,
    () => selectIsGeneratingSuggestedIngredients(session$.get()),
    () => selectIsGeneratingSuggestedIngredients(session$.get())
  );

  return (
    <CraftEmpty>
      <Section className="max-w-3xl mx-auto">
        <IngredientsLabel />
        <BadgeList>
          {items
            .filter(
              (_, index) =>
                (!ingredients.length && !isGenerating) ||
                index < ingredients.length
            )
            .map((item, index) => {
              return (
                <Badge
                  variant="outline"
                  className="carousel-item flex flex-row gap-1"
                  key={index}
                  event={{ type: "ADD_TOKEN", token: ingredients[index]! }}
                >
                  {ingredients[index] ? (
                    <>{ingredients[index]}</>
                  ) : (
                    <Skeleton className="w-8 h-4 animate-pulse" />
                  )}
                </Badge>
              );
            })}
        </BadgeList>
      </Section>
    </CraftEmpty>
  );
};

const selectSuggestedTags = (snapshot: SessionStoreSnapshot) => {
  return snapshot.context.browserSessionSnapshot?.context.suggestedTags || [];
};

const selectIsGeneratingSuggestedIngredients = (
  snapshot: SessionStoreSnapshot
) => {
  const value = snapshot.context.browserSessionSnapshot?.value;
  return (
    typeof value?.Suggestions === "object" &&
    typeof value.Suggestions.Ingredients === "string" &&
    value.Suggestions.Ingredients === "Running"
  );
};

const selectIsGeneratingSuggestedTags = (snapshot: SessionStoreSnapshot) => {
  const value = snapshot.context.browserSessionSnapshot?.value;
  return (
    typeof value?.Suggestions === "object" &&
    typeof value.Suggestions.Tags === "string" &&
    value.Suggestions.Tags === "Running"
  );
};

export const SuggestedTagsSection = () => {
  const items = new Array(20).fill(0);
  const session$ = usePageSessionStore();
  const tags = useSyncExternalStore(
    session$.subscribe,
    () => selectSuggestedTags(session$.get()),
    () => selectSuggestedTags(session$.get())
  );
  const isGenerating = useSyncExternalStore(
    session$.subscribe,
    () => selectIsGeneratingSuggestedTags(session$.get()),
    () => selectIsGeneratingSuggestedTags(session$.get())
  );

  return (
    <CraftEmpty>
      <Section className="max-w-3xl mx-auto">
        <TagsLabel />
        <BadgeList>
          {items
            .filter(
              (_, index) =>
                (!tags.length && !isGenerating) || index < tags.length
            )
            .map((_, index) => {
              return (
                <Badge
                  variant="outline"
                  className="carousel-item flex flex-row gap-1"
                  key={index}
                  event={{ type: "ADD_TOKEN", token: tags[index]! }}
                >
                  {tags[index] ? (
                    <>{tags[index]}</>
                  ) : (
                    <Skeleton className="w-8 h-4 animate-pulse" />
                  )}
                </Badge>
              );
            })}
        </BadgeList>
      </Section>
    </CraftEmpty>
  );
};

const TagsLabel = () => {
  return <SectionLabel icon={TagIcon} title="Tags" />;
};


