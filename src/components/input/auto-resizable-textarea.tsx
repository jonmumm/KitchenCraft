"use client";

import { selectIsOpen } from "@/app/@craft/selectors";
import { CraftContext } from "@/app/context";
import { SessionStoreContext } from "@/app/session-store.context";
// import { session$ } from "@/app/session-store";
import { useCraftIsOpen, usePromptIsPristine } from "@/hooks/useCraftIsOpen";
import { useEventHandler } from "@/hooks/useEventHandler";
import { useSelector } from "@/hooks/useSelector";
import { useSelectorCallback } from "@/hooks/useSelectorCallback";
import { useSend } from "@/hooks/useSend";
import { assert, shuffle } from "@/lib/utils";

import React, {
  ChangeEventHandler,
  ReactNode,
  RefObject,
  TextareaHTMLAttributes,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

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
  const actor = useContext(CraftContext);

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

    textarea.style.height = "28px"; // the h-7 line-height value, todo make dynamic

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
  useEventHandler("ADD_TOKEN", resizeTextarea);
  useEventHandler("REMOVE_TOKEN", resizeTextarea);

  useEffect(() => {
    resizeTextarea();
    window.addEventListener("resize", resizeTextarea);
    return () => window.removeEventListener("resize", resizeTextarea);
  }, [resizeTextarea]);

  useEffect(() => {
    resizeTextarea();
  }, [props.value, size, resizeTextarea]);

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
    const actor = useContext(CraftContext);
    const isOpen = useCraftIsOpen();
    const isPristine = usePromptIsPristine();
    const [placeholdersGenerating, setPlaceholderGenerating] = useState(false);
    const session$ = useContext(SessionStoreContext);

    // hack figure out better solution for subscribing to server state
    useEffect(() => {
      return session$.subscribe((state) => {
        setPlaceholderGenerating(
          state.value.Craft.Generators.Placeholder === "Generating"
        );
      });
    }, [setPlaceholderGenerating, session$]);

    const value = useSelector(actor, (state) => state.context.prompt);
    const handleChange: ChangeEventHandler<HTMLTextAreaElement> = useCallback(
      (e) => {
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
      const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
      const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

      const animatePlaceholder = useCallback(() => {
        const sentences = shuffle(session$.get().context.placeholders);
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
      }, []);

      useEffect(() => {
        const cleanup = animatePlaceholder();
        return () => {
          cleanup();
          if (ref.current) {
            ref.current.placeholder = "";
          }
        };
      }, [animatePlaceholder]);

      return null;
    };

    return (
      <>
        {isPristine && !placeholdersGenerating && <PlaceholderAnimation />}
        <textarea
          suppressHydrationWarning
          value={value}
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
