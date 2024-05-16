"use client";

// In your specific TypeScript file
declare global {
  interface Window {
    removePromptListener?: () => {}; // Optional property to handle cases where it might not be set
  }
}

import { Badge } from "@/components/display/badge";
import { Skeleton } from "@/components/display/skeleton";
import AutoResizableTextarea from "@/components/input/auto-resizable-textarea";
import { Button } from "@/components/input/button";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { getPlatformInfo } from "@/lib/device";
import { cn } from "@/lib/utils";
import { AppEvent } from "@/types";
import { useStore } from "@nanostores/react";
import {
  ArrowLeftIcon,
  ChevronRight,
  Settings2Icon,
  XCircleIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
  useSyncExternalStore,
} from "react";
import { CraftEmpty, CraftNotEmpty } from "../@craft/components.client";
import { CraftContext } from "../context";
import { PageSessionSnapshot } from "../page-session-machine";
import { PageSessionContext } from "../page-session-store.context";

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
  const session$ = useContext(PageSessionContext);
  const session = useStore(session$);
  return <div>{session.context.suggestedText[index]}</div>;
};

export const CraftAutoComplete = () => {
  const session$ = useContext(PageSessionContext);
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

const selectPrompt = (snapshot: PageSessionSnapshot) => {
  return snapshot.context.prompt;
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
  const initialBlurRef = useRef(false);
  const initialFocusRef = useRef(false);
  const store = usePageSessionStore();
  const [initialValue] = useState(selectPrompt(store.get()));
  const actor = useContext(CraftContext);

  const [autoFocus, setAutofocus] = useState(
    actor.getSnapshot().value.Hydration === "Waiting" && initialAutoFocus
  );

  const send = useSend();
  const handleBlur = useCallback(() => {
    setAutofocus(false);
    if (autoFocus && initialBlurRef.current) {
      send({ type: "BLUR_PROMPT" });
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

  const handleOpenSettings = useCallback(() => {
    send({ type: "OPEN_SETTINGS" });
  }, [send]);

  const handleClear = useCallback(() => {
    send({ type: "CLEAR", all: true });
  }, [send]);

  const handleFocus = useCallback(() => {
    const inputElement = document.getElementById("prompt");
    if (!inputElement) return;

    const isMobile = !initialAutoFocus;

    // Set opacity to 0 to prevent automatic scrolling
    if (isMobile) inputElement.style.opacity = "0";
    window.scrollTo(0, 0);

    // requestAnimationFrame(() => {
    //   inputElement.style.opacity = "1";
    // }); // Adjust timing as needed

    // Hack
    // Doing it with 0 and RAF don't work
    setTimeout(() => {
      if (isMobile) inputElement.style.opacity = "1";
      window.scrollTo(0, 0);
    }, 350); // Adjust timing as needed

    if (autoFocus && initialFocusRef.current) {
      initialFocusRef.current = true;
      return;
    }
    send({ type: "FOCUS_PROMPT" });
  }, [send, autoFocus, initialFocusRef, initialAutoFocus]);

  const PromptCarrot = () => {
    const actor = useContext(CraftContext);
    const isOpen = useSelector(
      actor,
      (state) => !state.matches({ Open: "False" })
    );
    return (
      <ChevronRight
        className={cn(
          isOpen ? "w-0 ml-1" : "w-4 ml-4",
          "h-4 shrink-0 opacity-50 self-start mt-1.5"
        )}
      />
    );
  };

  return (
    <div
      className={cn(
        "flex flex-row gap-2 items-center w-full relative",
        className
      )}
    >
      <PromptCarrot />
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
      <CraftEmpty>
        <Settings2Icon
          onClick={handleOpenSettings}
          className="mr-4 h-5 w-5 shrink-0 opacity-60 self-start mt-1 active:opacity-30 cursor-pointer"
        />
      </CraftEmpty>
      <CraftNotEmpty>
        <XCircleIcon
          onClick={handleClear}
          className="mr-4 h-5 w-5 shrink-0 opacity-60 self-start mt-1 active:opacity-30 cursor-pointer sticky bottom-0"
        />
      </CraftNotEmpty>
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

const selectSuggestedTokens = (snapshot: PageSessionSnapshot) => {
  return snapshot.context.browserSessionSnapshot?.context.suggestedTokens || [];
};

export const HomepageSuggestedTokens = () => {
  const items = new Array(6).fill(0);
  const session$ = usePageSessionStore();
  const tokens = useSyncExternalStore(
    session$.subscribe,
    () => selectSuggestedTokens(session$.get()),
    () => selectSuggestedTokens(session$.get())
  );
  const hasTokens = !!tokens.length;

  return (
    <>
      {items
        .filter((_, idx) => !hasTokens || idx < tokens.length)
        .map((_, idx) => {
          const token = tokens[idx];
          const eventProps = token
            ? {
                event: {
                  type: "ADD_TOKEN",
                  token,
                } satisfies AppEvent,
              }
            : {};
          return (
            <div key={idx}>
              <Badge
                className={cn(
                  "cursor-pointer",
                  tokens[idx] ? "" : "animate-pulse"
                )}
                variant="outline"
                {...eventProps}
              >
                {token ? <>{token}</> : <Skeleton className="w-8 h-4" />}
              </Badge>
            </div>
          );
        })}
    </>
  );
};

const selectNumItemsInList = (snapshot: PageSessionSnapshot) => {
  return snapshot.context.currentListRecipeIds.length;
};

export const ListIndicator = () => {
  const store = usePageSessionStore();
  const numItemsInList = useSyncExternalStore(
    store.subscribe,
    () => selectNumItemsInList(store.get()),
    () => selectNumItemsInList(store.get())
  );

  return (
    <>
      {numItemsInList !== 0 && (
        <span className="indicator-item badge badge-neutral p-1 text-xs">
          {numItemsInList}
        </span>
      )}
    </>
  );
};
