"use client";

import { selectIsOpen } from "@/app/@craft/selectors";
import { AppContext } from "@/app/context";
import { PageSessionSnapshot } from "@/app/page-session-machine";
import { PageSessionContext } from "@/app/page-session-store.context";
// import { session$ } from "@/app/session-store";
import { usePromptIsPristine } from "@/hooks/useCraftIsOpen";
import { useEventHandler } from "@/hooks/useEventHandler";
import { usePageSessionStoreMatchesState } from "@/hooks/usePageSessionStoreMatchesState";
import { useSelectorCallback } from "@/hooks/useSelectorCallback";
import { useSend } from "@/hooks/useSend";
import { assert, shuffle } from "@/lib/utils";
import { ExtractAppEvent } from "@/types";
import { produce } from "immer";

import React, {
  ChangeEventHandler,
  ReactNode,
  RefObject,
  TextareaHTMLAttributes,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { createSelector } from "reselect";

type Size = "xs" | "sm" | "md" | "lg"; // Extend with more sizes as needed

interface AutoResizableTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  size?: Size;
  placeholderComponent?: ReactNode; // Prop for the custom placeholder component
  initialValue?: string;
}

const sizeClassMap: Record<Size, { textSize: string; heightClass: string }> = {
  xs: { textSize: "text-xs", heightClass: "h-4" },
  sm: { textSize: "text-sm", heightClass: "h-5" },
  md: { textSize: "text-md", heightClass: "h-6" },
  lg: { textSize: "text-lg", heightClass: "h-7" },
};

const AutoResizableTextarea: React.FC<
  AutoResizableTextareaProps & { ref?: RefObject<HTMLTextAreaElement> }
> = ({
  className,
  size = "lg",
  placeholderComponent,
  onChange,
  initialValue,
  ...props
}) => {
  const send = useSend();
  const actor = useContext(AppContext);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
      send({ type: "HYDRATE_INPUT", ref: textareaRef.current });
    }
  }, [send]);

  const ref = props.ref || textareaRef;
  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const minHeight = "86px";
    textarea.style.height = minHeight; // todo should be dynamicd?

    // Resize logic
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseInt(computedStyle.lineHeight, 10);
    const isCrafting = document.body.classList.contains("crafting");
    const numberOfLines = isCrafting
      ? Math.floor(textarea.scrollHeight / lineHeight)
      : 1;
    const requiredHeight = numberOfLines * lineHeight;
    textarea.style.height = `${requiredHeight}px`;
  }, []);
  useSelectorCallback(actor, selectIsOpen, (value) => {
    setTimeout(() => {
      resizeTextarea();
    }, 0);
  });
  useEventHandler("CLEAR", resizeTextarea);
  const onAddToken = useCallback(
    (event: ExtractAppEvent<"ADD_TOKEN">) => {
      const currentValue = textareaRef.current?.value || "";

      let nextValue;
      if (currentValue.length) {
        nextValue = currentValue + `, ${event.token}`;
      } else {
        nextValue = event.token;
      }
      if (textareaRef.current) {
        textareaRef.current.value = nextValue;
      }
      resizeTextarea();
    },
    [resizeTextarea]
  );
  useEventHandler("ADD_TOKEN", onAddToken);

  useEffect(() => {
    resizeTextarea();
    window.addEventListener("resize", resizeTextarea);
    return () => window.removeEventListener("resize", resizeTextarea);
  }, [resizeTextarea]);

  // useEffect(() => {
  //   resizeTextarea();
  // }, [props.value, size, resizeTextarea]);

  useEffect(() => {
    // return session$.subscribe(() => {
    //   resizeTextarea();
    // });
  }, [resizeTextarea]);

  const textSizeClass =
    sizeClassMap[size]?.textSize || sizeClassMap["md"].textSize;
  const heightClass =
    sizeClassMap[size]?.heightClass || sizeClassMap["md"].heightClass;

  const Placeholder = () => {
    const isPristine = usePromptIsPristine();

    return (
      isPristine && (
        <div className="absolute inset-0 transition-opacity duration-75 crafting:opacity-0 pointer-events-none crafting:hidden prompt-dirty:hidden">
          {placeholderComponent}
        </div>
      )
    );
  };

  const Textarea = () => {
    // const value = useSelector(actor, (state) => state.context.prompt);

    // const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> =
    //   useCallback((e) => {
    //     alert(e.key);
    //     if (e.key === "Enter") {
    //       alert("ENTER!");
    //       e.preventDefault();
    //       e.currentTarget.blur(); // Close the keyboard
    //     }
    //   }, []);

    const handleChange: ChangeEventHandler<HTMLTextAreaElement> = useCallback(
      (e) => {
        // alert(e.nativeEvent.key);
        console.log(e.nativeEvent);
        onChange && onChange(e);
        resizeTextarea();
      },
      []
    );

    const handleBlur: ChangeEventHandler<HTMLTextAreaElement> = useCallback(
      (e) => {
        resizeTextarea();
      },
      []
    );

    const handleFocus: ChangeEventHandler<HTMLTextAreaElement> = useCallback(
      (e) => {
        resizeTextarea();
      },
      []
    );

    const PlaceholderAnimation = () => {
      const isPristine = usePromptIsPristine();
      const placeholdersGenerating = usePageSessionStoreMatchesState({
        Craft: { Generators: { Placeholder: "Generating" } },
      });

      const Animation = () => {
        const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
        const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
        const session$ = useContext(PageSessionContext);

        // hack figure out better solution for subscribing to server state
        // useEffect(() => {
        //   return session$.subscribe((state) => {
        //     setPlaceholderGenerating(
        //       state.value.Craft.Generators.Placeholder === "Generating"
        //     );
        //   });
        // }, [session$]);

        const placeholders = useSyncExternalStore(
          session$.subscribe,
          () => selectPromptPlaceholders(session$.get()),
          () => selectPromptPlaceholders(session$.get())
        );

        const animatePlaceholder = useCallback(() => {
          assert(placeholders, "expected placehodlers");
          const sentences = produce(placeholders, (draft) => {
            shuffle(draft);
          });
          let currentSentenceIndex = 0;
          let typing = true;
          let currentText = "";

          const clearTimers = () => {
            if (intervalIdRef.current) {
              clearInterval(intervalIdRef.current);
              intervalIdRef.current = null;
            }
            if (timeoutIdRef.current) {
              clearTimeout(timeoutIdRef.current);
              timeoutIdRef.current = null;
            }
          };

          const typeText = () => {
            const sentence = sentences[currentSentenceIndex];
            assert(sentence, "expected sentence");
            if (typing) {
              if (currentText.length < sentence.length) {
                currentText = sentence.slice(0, currentText.length + 1);
              } else {
                if (!timeoutIdRef.current) {
                  timeoutIdRef.current = setTimeout(() => {
                    typing = false;
                    timeoutIdRef.current = null;
                    typeText(); // Immediately proceed to deletion
                  }, 1000);
                }
              }
            } else {
              if (currentText.length > 0) {
                currentText = currentText.slice(0, -1);
              } else {
                typing = true;
                currentSentenceIndex =
                  (currentSentenceIndex + 1) % sentences.length;
                typeText(); // Reset typing immediately for the next sentence
              }
            }

            if (ref.current) {
              ref.current.placeholder = currentText;
            }
          };

          clearTimers();
          intervalIdRef.current = setInterval(typeText, 100);

          return clearTimers;
        }, [placeholders]);

        useEffect(() => {
          if (placeholders && placeholders.length) {
            const cleanup = animatePlaceholder();
            return () => {
              cleanup();
              if (ref.current) {
                ref.current.placeholder = "";
              }
            };
          }
        }, [animatePlaceholder, placeholders]);

        return null;
      };

      return <>{isPristine && !placeholdersGenerating && <Animation />}</>;
    };

    return (
      <>
        <PlaceholderAnimation />
        <textarea
          suppressHydrationWarning
          ref={ref}
          className={`peer resize-none block w-full ${textSizeClass} ${heightClass} outline-none bg-transparent overflow-y-hidden placeholder-slate-500`}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          {...props}
          // onChange={(e) => {
          //   handleSearch(e.target.value);
          // }}
          // defaultValue={searchParams.get("query")?.toString()}
        />
      </>
    );
  };

  return (
    <div className="relative block flex-1 items-center mr-3">
      <Textarea />
      <Placeholder />
    </div>
  );
};

export default AutoResizableTextarea;

// const ingredientPlaceholderSentences = [
//   "feta, egg, leftover pizza",
//   "avocado, chocolate, chia seeds",
//   "spinach, blueberries, almonds",
//   "sweet potato, black beans, lime",
//   "bacon, maple syrup, pecans",
//   "quinoa, beets, goat cheese",
//   "apple, cinnamon, honey",
//   "salmon, soy sauce, ginger",
//   "chicken, peanut butter, sriracha",
//   "tomato, basil, mozzarella",
//   "pumpkin, coconut milk, curry powder",
//   "mushrooms, garlic, thyme",
//   "kale, avocado, lemon",
//   "shrimp, coconut, pineapple",
//   "lemon, raspberry, vanilla",
//   "zucchini, carrot, feta cheese",
//   "oats, banana, peanut butter",
//   "fig, balsamic vinegar, arugula",
//   "eggplant, tomato, ricotta",
//   "cucumber, dill, yogurt",
// ];

// const remixPlaceholderSentences = [
//   "Double the servings",
//   "Adapt for Instant Pot",
//   "Make it one-pan",
//   "Use an air fryer",
//   "Swap in whole grains",
//   "Make it vegetarian",
//   "Add a spicy kick",
//   "Transform into a soup",
//   "Bake instead of fry",
//   "Cook it slow and low",
//   "Turn into a casserole",
//   "Grill for extra flavor",
//   "Make it no-bake",
//   "Substitute with healthier fats",
//   "Switch to gluten-free",
//   "Incorporate a new protein",
//   "Simplify to five ingredients",
// ];

const selectInProgressSuggestedPlaceholders = (
  snapshot: PageSessionSnapshot
) => {
  return snapshot.context.placeholders;
};

const selectEmptyStateSuggestedPlaceholders = (
  snapshot: PageSessionSnapshot
) => {
  return snapshot.context.browserSessionSnapshot?.context.suggestedPlaceholders;
};

const selectHasTokens = (snapshot: PageSessionSnapshot) => {
  return !!snapshot.context.tokens.length;
};

const selectPromptPlaceholders = createSelector(
  selectEmptyStateSuggestedPlaceholders,
  selectInProgressSuggestedPlaceholders,
  selectHasTokens,
  (emptyStatePlaceholders, inProgressPlaceholders, hasTokens) => {
    if (hasTokens) {
      return inProgressPlaceholders;
    } else {
      return emptyStatePlaceholders;
    }
  }
);
