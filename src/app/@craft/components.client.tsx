"use client";

import { Badge } from "@/components/display/badge";
import { Card } from "@/components/display/card";
import MarkdownRenderer from "@/components/display/markdown";
import { Skeleton } from "@/components/display/skeleton";
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
import { appSelectorComponent } from "@/components/util/app-selector";
import { combinedSelectorComponent } from "@/components/util/combined-selector";
import { PageSessionSelector } from "@/components/util/page-session-selector";
import { LIST_SLUG_INPUT_KEY } from "@/constants/inputs";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useCombinedSelector } from "@/hooks/useCombinedSelector";
import { useEventHandler } from "@/hooks/useEventHandler";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { assert, cn } from "@/lib/utils";
import { RecipeCraftingPlaceholder } from "@/modules/recipe/crafting-placeholder";
import { ChefNameSchema, SlugSchema } from "@/schema";
import {
  selectHasSubmittedPrompt,
  selectSubmittedPrompt,
} from "@/selectors/app.selectors";
import {
  createSuggestedTokenAtIndexSelector,
  selectHasAtLeastOneCompleteSuggestedRecipe,
  selectHasAtLeastTwoStartedSuggestedRecipes,
  selectHasRecipesGenerated,
  selectNumSuggestedRecipes,
} from "@/selectors/combined.selectors";
import {
  selectHasRecipesSelected,
  selectSelectedRecipeCount,
} from "@/selectors/page-session.selectors";
import { ExtractAppEvent } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStore } from "@nanostores/react";
import { Label } from "@radix-ui/react-label";
import useEmblaCarousel from "embla-carousel-react";
import {
  BookmarkIcon,
  CarrotIcon,
  ShareIcon,
  TagIcon,
  XIcon,
} from "lucide-react";
import { WritableAtom, atom } from "nanostores";
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
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { twc } from "react-twc";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import { z } from "zod";
import { AppContext } from "../context";
import { PageSessionSnapshot } from "../page-session-machine";
import { PageSessionContext } from "../page-session-store.context";
import { SuggestedRecipeCard } from "./suggested-recipe-card";

export const HasRecipesGenerated = combinedSelectorComponent(
  selectHasRecipesGenerated
);

// export const IsTakingLongerThanUsual = combinedSelectorComponent(
//   selectIsTakingLongerThanUsual
// );

export const IsTakingLongerThanUsual = ({
  children,
  timeoutMs = 5000,
}: {
  children: ReactNode;
  timeoutMs?: number;
}) => {
  const submittedPrompt = useAppSelector(selectSubmittedPrompt);
  const [hasTimePassed, setHasTimePassed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setHasTimePassed(false);
    timerRef.current = setTimeout(() => {
      setHasTimePassed(true);
    }, timeoutMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [submittedPrompt, setHasTimePassed, timerRef]);

  return submittedPrompt.length && hasTimePassed ? (
    <HasAtLeastTwoStartedSuggestedRecipe not>
      {children}
    </HasAtLeastTwoStartedSuggestedRecipe>
  ) : (
    <></>
  );
};

export const HasAtLeastTwoStartedSuggestedRecipe = combinedSelectorComponent(
  selectHasAtLeastTwoStartedSuggestedRecipes
);

export const HasAtLeastOneCompleteSuggestedRecipe = combinedSelectorComponent(
  selectHasAtLeastOneCompleteSuggestedRecipe
);

// export const HasAtLeastThreeIncompleteSuggestedRecipe = combinedSelectorComponent(
//   selectHasAtLeastThreeIncompleteSuggestedRecipes
// );

export const HasSubmittedPrompt = appSelectorComponent(
  selectHasSubmittedPrompt
);

export const CraftEmpty = ({ children }: { children: ReactNode }) => {
  const promptLength = usePromptLength();
  const numTokens = useNumTokens();

  return !numTokens && promptLength === 0 ? <>{children}</> : null;
};

export const IsCrafting = ({ children }: { children: ReactNode }) => (
  <PageSessionSelector selector={selectHasRecipesSelected}>
    {children}
  </PageSessionSelector>
);

export const HasRecipesSelected = ({ children }: { children: ReactNode }) => (
  <PageSessionSelector selector={selectHasRecipesSelected}>
    {children}
  </PageSessionSelector>
);

// export const CraftNoResults = ({ children }: { children: ReactNode }) => {
//   return (
//     <PageSessionMatches
//       matchedState={{ Craft: { Generators: { Recipes: "Generating" } } }}
//     >
//       {children}
//     </PageSessionMatches>
//   );
// };

export const CraftNotEmpty = ({ children }: { children: ReactNode }) => {
  const promptLength = usePromptLength();
  return promptLength !== 0 ? <>{children}</> : null;
};

export const CraftingPlacholder = () => {
  const actor = useContext(AppContext);
  const selection = useSelector(actor, (state) => state.context.selection);

  return selection && <RecipeCraftingPlaceholder />;
};

export const SuggestedRecipeCards = () => {
  const numCards = useCombinedSelector(selectNumSuggestedRecipes);
  const count = Math.max(12, numCards);
  const items = new Array(count).fill(0);

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
  const actor = useContext(AppContext);
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

export const SuggestedTokenBadge = ({
  index,
  className,
}: {
  index: number;
  className: string;
}) => {
  const actor = useContext(AppContext);
  const isTyping = useSelector(actor, (state) =>
    state.matches({ Typing: "True" })
  );
  const session$ = usePageSessionStore();
  const session = useStore(session$);
  const isGenerating = session.value.Craft.Generators.Tokens === "Generating";
  const selectSuggestedToken = useMemo(
    () => createSuggestedTokenAtIndexSelector(index),
    [index]
  );
  const token = useCombinedSelector(selectSuggestedToken);
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
  }, [send, form]);

  const onSubmit = useCallback(
    async (data: z.infer<typeof emailFormSchema>) => {
      setDisabled(true);
      try {
        send({ type: "SUBMIT", name: "email" });
        await signIn("email", {
          email: data.email,
          redirect: false,
        });

        const passcodeParams = new URLSearchParams({
          email: data.email,
        });

        // const context = session$.get().context;
        // const currentRecipeId =
        //   context.suggestedRecipes[context.currentItemIndex];
        // assert(currentRecipeId, "expected currentRecipeId");
        // const recipe = context.recipes[currentRecipeId];

        // const slug = recipe?.slug;
        // assert(slug, "expected recipe slug");

        // const callbackUrl = `/recipe/${slug}`;
        // passcodeParams.set("callbackUrl", callbackUrl);

        router.push(`/auth/passcode?${passcodeParams.toString()}`);
      } catch (error) {
        console.error("Sign in failed:", error);
        setDisabled(false);
      }
    },
    [router, session$, send]
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
      send({ type: "CHANGE", name: "profileName", value });
    }).unsubscribe;
  }, [form.watch, send]);

  const onSubmit = useCallback(
    async (data: z.infer<typeof chefNameFormSchema>) => {
      setDisabled(true);
      send({ type: "SUBMIT", name: "chefName" });
    },
    [session$, send]
  );

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

const createListFormSchema = z.object({
  [LIST_SLUG_INPUT_KEY]: SlugSchema,
});

export const EnterListSlugForm = () => {
  const store = useContext(PageSessionContext);
  const [disabled, setDisabled] = useState(false);
  const send = useSend();

  const form = useForm({
    resolver: zodResolver(createListFormSchema),
    defaultValues: {
      [LIST_SLUG_INPUT_KEY]: store.get().context.listSlug || "",
    },
  });

  useEffect(() => {
    return form.watch((data) => {
      const value = data.listSlug || "";
      send({ type: "CHANGE", name: LIST_SLUG_INPUT_KEY, value });
    }).unsubscribe;
  }, [form, send]);

  const onSubmit = useCallback(
    async (data: z.infer<typeof createListFormSchema>) => {
      setDisabled(true);
      send({ type: "SUBMIT", name: LIST_SLUG_INPUT_KEY });
    },
    [send]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
        <FormField
          control={form.control}
          name={LIST_SLUG_INPUT_KEY}
          render={({ field, fieldState }) => (
            <FormItem>
              {/* <FormValueSender /> */}
              {/* <FormLabel>Name</FormLabel> */}
              <div className="flex flex-row gap-2">
                <span className="text-3xl mt-2">️#</span>
                <FormControl>
                  <PlaceholderAnimatingInput
                    samplePlaceholders={[
                      "tues-dinner",
                      "weekend-bbq",
                      "work-snacks",
                      "bday-cake",
                      "kid-meals",
                      "20min-meals",
                      "huncal",
                    ]}
                    autoCapitalize="none"
                    autoFocus
                    disabled={disabled}
                    type="text"
                    {...field}
                  />
                </FormControl>
              </div>
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
          size="xl"
        >
          Submit
        </Button>
      </form>
    </Form>
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
  const actor = useContext(AppContext);
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

const selectSuggestedIngredients = (snapshot: PageSessionSnapshot) => {
  return snapshot.context.sessionSnapshot?.context.suggestedIngredients || [];
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
    <HasSubmittedPrompt not>
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
    </HasSubmittedPrompt>
  );
};

const selectSuggestedTags = (snapshot: PageSessionSnapshot) => {
  return snapshot.context.sessionSnapshot?.context.suggestedTags || [];
};

const selectIsGeneratingSuggestedIngredients = (
  snapshot: PageSessionSnapshot
) => {
  const value = snapshot.context.sessionSnapshot?.value;
  return (
    typeof value?.Suggestions === "object" &&
    typeof value.Suggestions.Ingredients === "string" &&
    value.Suggestions.Ingredients === "Running"
  );
};

const selectIsGeneratingSuggestedTags = (snapshot: PageSessionSnapshot) => {
  const value = snapshot.context.sessionSnapshot?.value;
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
    <HasSubmittedPrompt not>
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
    </HasSubmittedPrompt>
  );
};

const TagsLabel = () => {
  return <SectionLabel icon={TagIcon} title="Tags" />;
};

export const SelectedRecipesBar = () => {
  const numSelected = usePageSessionSelector(selectSelectedRecipeCount);

  return (
    <div className="px-2 pb-2 z-50 pointer-events-auto">
      <Card
        className="flex flex-row gap-2 p-1 justify-between items-center"
        variant="locontrast"
      >
        <Button variant="outline" event={{ type: "SHARE_SELECTED" }}>
          <ShareIcon className="mr-1" size={14} />
          Share
        </Button>
        <div className="flex-1">
          <Link href="#selected">
            <Button
              variant="secondary"
              className="text-sm font-semibold w-full "
            >
              ✅ Selected
              <span className="bg-purple-700 text-white rounded-full text-center ml-1 px-1">
                {numSelected}
              </span>
            </Button>
          </Link>
        </div>
        <Button variant="outline" event={{ type: "SAVE_SELECTED" }}>
          Save
          <BookmarkIcon className="ml-1" size={14} />
        </Button>
      </Card>
    </div>
  );
};

export const HintCarousel = () => {
  const [emblaRef] = useEmblaCarousel();
  const [hintComplete$] = useState(atom(false));

  const hasAtLeastTwoStartedSuggestedRecipes = useCombinedSelector(
    selectHasAtLeastTwoStartedSuggestedRecipes
  );
  const isComplete = useStore(hintComplete$);

  useEffect(() => {
    if (hasAtLeastTwoStartedSuggestedRecipes) {
      hintComplete$.set(true);
    }
  }, [hasAtLeastTwoStartedSuggestedRecipes, hintComplete$]);

  const hints = usePageSessionSelector(
    (state) => state.context.sessionSnapshot?.context.hints
  );
  const store = usePageSessionStore();
  const [dismissedHints$] = useState(
    atom<Record<number, true>>(
      store.get().context.sessionSnapshot?.context.dismissedHints || {}
    )
  );

  const handleDismiss = useCallback(
    (event: ExtractAppEvent<"DISMISS_HINT">) => {
      dismissedHints$.set({
        ...dismissedHints$.get(),
        [event.index]: true,
      });
    },
    [dismissedHints$]
  );
  const dismissedHints = useStore(dismissedHints$);

  useEventHandler("DISMISS_HINT", handleDismiss);

  if (hasAtLeastTwoStartedSuggestedRecipes || isComplete) {
    return <></>;
  }

  return (
    <div
      className={"embla max-w-[100vw] mx-auto pointer-events-auto"}
      ref={emblaRef}
    >
      {/* <div className={`${styles.embla__viewport} max-w-[100vw] mx-auto`}>
        <Badge variant="secondary" className="py-1 px-3 relative"> */}
      <div className={"embla__container touch-pan-x p-4"}>
        {hints
          ?.map((hint, index) => {
            return (
              <div
                key={hint}
                className={`embla__slide min-w-0 max-w-full flex justify-center mr-2`}
                style={{ flex: "0 0 100%" }}
              >
                <Badge
                  variant="secondary"
                  className="px-3 py-1 rounded-sm shadow-lg relative"
                >
                  <Button
                    className="absolute z-60 -top-2 -right-1 p-0 w-fit h-fit shadow-sm border border-slate-400 dark:border-slate-600 border-solid rounded-full"
                    variant="secondary"
                    data-index={index}
                    event={{ type: "DISMISS_HINT", index }}
                  >
                    <XIcon size={14} />
                  </Button>
                  <MarkdownRenderer
                    className="line-clamp-2"
                    variant="single_line"
                    markdownText={hint}
                  />
                </Badge>
              </div>
            );
          })
          .filter((_, index) => !dismissedHints[index])}
      </div>
      {/* </Badge>
      </div> */}
    </div>
  );
};
