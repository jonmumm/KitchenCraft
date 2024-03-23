"use client";

// In your specific TypeScript file
declare global {
  interface Window {
    removePromptListener?: () => {}; // Optional property to handle cases where it might not be set
  }
}

import AutoResizableTextarea from "@/components/input/auto-resizable-textarea";
import { Button } from "@/components/input/button";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { getPlatformInfo } from "@/lib/device";
import { cn } from "@/lib/utils";
import { useStore } from "@nanostores/react";
import { ArrowLeftIcon, ChevronRight, XCircleIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChangeEventHandler,
  ComponentProps,
  KeyboardEventHandler,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePreventScroll } from "react-aria";
import { CraftContext } from "../context";
import { SessionStoreContext } from "../session-store.context";

export const AppInstallContainer = ({ children }: { children: ReactNode }) => {
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const { isInPWA } = getPlatformInfo(navigator.userAgent);
    if (isInPWA) {
      setInstalled(true);
    }
  }, [setInstalled]);

  return !installed ? <>{children}</> : <></>;
};

// Once the client loads, we rely on browser back calls instead of
// form action post to calculate back
export const BackButton = (props: {
  handleBack: () => Promise<void>;
  hasHistory: boolean;
  variant?: ComponentProps<typeof Button>["variant"];
}) => {
  const [showLink, setShowLink] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setShowLink(false);
  }, [showLink]);

  const Content = () => (
    <Button
      variant={props.variant || "ghost"}
      type="submit"
      onClick={(event) => {
        console.log(history.length);
        if (history.length > 3) {
          router.back();
        } else {
          router.push("/");
        }
        event.preventDefault();
      }}
    >
      <ArrowLeftIcon />
    </Button>
  );

  return showLink ? (
    <form action={props.handleBack}>
      <Content />
    </form>
  ) : (
    <Content />
  );
};

const CraftAutoCompleteItem = ({ index }: { index: number }) => {
  const session$ = useContext(SessionStoreContext);
  const session = useStore(session$);
  return <div>{session.context.suggestedText[index]}</div>;
};

export const CraftAutoComplete = () => {
  const session$ = useContext(SessionStoreContext);
  const session = useStore(session$);
  const items = new Array(6).fill(0);

  return (
    <div className="mt-2 px-4 flex flex-col gap-2 flex-wrap">
      {items.map((_, index) => {
        return <CraftAutoCompleteItem key={index} index={index} />;
      })}
    </div>
  );
};

export const CraftInput = ({
  commandBadge,
  initialAutoFocus,
  className,
}: {
  commandBadge: boolean;
  initialAutoFocus?: boolean;
  className?: string;
}) => {
  usePreventScroll();
  const initialParam = useSearchParams();
  const initialBlurRef = useRef(false);
  const initialFocusRef = useRef(false);
  const [initialValue] = useState(initialParam.get("prompt") || "");
  const actor = useContext(CraftContext);

  const [autoFocus, setAutofocus] = useState(
    actor.getSnapshot().value.Hydration === "Waiting" &&
      (initialParam.get("crafting") === "1" || initialAutoFocus)
  );

  const send = useSend();
  const handleBlur = useCallback(() => {
    if (autoFocus && initialBlurRef.current) {
      send({ type: "BLUR_PROMPT" });
      setAutofocus(false);
    } else if (!autoFocus) {
      send({ type: "BLUR_PROMPT" });
    }
    initialBlurRef.current = true;
  }, [send, autoFocus, initialBlurRef, setAutofocus]);

  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (e) => {
      send({ type: "SET_INPUT", value: e.target.value });
    },
    [send]
  );

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = useCallback(
    (keyboardEvent) => {
      send({ type: "KEY_DOWN", keyboardEvent });
    },
    [send]
  );

  const handleClear = useCallback(() => {
    send({ type: "CLEAR" });
  }, [send]);

  const handleFocus = useCallback(() => {
    const inputElement = document.getElementById("prompt");
    if (!inputElement) return;

    // Set opacity to 0 to prevent automatic scrolling
    // inputElement.style.opacity = "0";
    window.scrollTo(0, 0);

    // requestAnimationFrame(() => {
    //   inputElement.style.opacity = "1";
    // }); // Adjust timing as needed

    // Hack
    // Doing it with 0 and RAF don't work
    // setTimeout(() => {
    //   inputElement.style.opacity = "1";
    //   window.scrollTo(0, 0);
    // }, 500); // Adjust timing as needed

    if (autoFocus && initialFocusRef.current) {
      initialFocusRef.current = true;
      return;
    }
    send({ type: "FOCUS_PROMPT" });
  }, [send, autoFocus, initialFocusRef]);

  return (
    <div
      className={cn(
        "flex flex-row gap-2 items-center w-full relative",
        className
      )}
    >
      <ChevronRight className="ml-4 h-4 w-4 shrink-0 opacity-50 self-start mt-2" />
      <AutoResizableTextarea
        id="prompt"
        initialValue={initialValue}
        autoFocus={autoFocus}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholderComponent={
          <div className="flex flex-row w-full h-full relative justify-end items-center">
            {/* {commandBadge && (
              <Badge variant="secondary" className="mr-4">
                <CommandIcon size={14} />
                <span style={{ fontSize: "14px" }}>K</span>
              </Badge>
            )} */}
          </div>
        }
      />
      <XCircleIcon
        onClick={handleClear}
        className="mr-4 h-5 w-5 shrink-0 opacity-60 self-start mt-1 hidden prompt-dirty:block prompt-pristine:hidden active:opacity-30 cursor-pointer"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            const promptElement = document.getElementById('prompt');

            function handleFocus() {
              document.body.classList.add('crafting');
            }

            function handleBlur() {
              if (promptElement.value.length === 0) {
                document.body.classList.remove('crafting');
              }
            }

            function handleInput(event) {
              if (promptElement.value.length > 0) {
                document.body.classList.add('prompt-dirty');
                document.body.classList.remove('prompt-pristine');
              } else {
                document.body.classList.remove('prompt-dirty');
                document.body.classList.add('prompt-pristine');
              }
            }

            function setupPromptListener() {
                if (promptElement) {
                  promptElement.addEventListener('focus', handleFocus);
                  promptElement.addEventListener('blur', handleBlur);
                  promptElement.addEventListener('input', handleInput);
                } else {
                  console.warn("couldn't find #prompt element")
                }

                return function() {
                  promptElement.removeEventListener('focus', handleFocus);
                  promptElement.removeEventListener('blur', handleBlur);
                  promptElement.removeEventListener('input', handleInput);
                }
            }
            // todo remove the listener react loads
            // var removePromptListener = setupPromptListener();
          `,
        }}
      />
    </div>
  );
};

export const KeyboardToggle = () => {
  const send = useSend();
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        send({ type: "TOGGLE" });
      } else if (e.key === "Escape") {
        e.preventDefault();
        send({ type: "CLOSE" });
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [send]);
  return null;
};

export const VisibleIfTypingPrompt = ({
  children,
}: {
  children: ReactNode;
}) => {
  const actor = useContext(CraftContext);
  const prompt = useSelector(actor, (state) => state.context.prompt);

  return (
    <div className={prompt?.length ? "hidden" : `group-focus-within:hidden`}>
      {children}
    </div>
  );
};
