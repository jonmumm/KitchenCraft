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
import { ListIndicator } from "@/components/list-indicator";
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
  ListIcon,
  Settings2Icon
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
import { AppContext } from "../context";
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
  const actor = useContext(AppContext);

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
    const actor = useContext(AppContext);
    const isOpen = useSelector(
      actor,
      (state) => !state.matches({ Open: "False" })
    );
    return !isOpen ? (
      <Button variant="ghost" size="icon" disabled>
        <ChevronRight />
      </Button>
    ) : (
      <div className="w-1 h-full"></div>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-row gap-2 items-stretch justify-between w-full relative",
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
        <div className="flex flex-col justify-start items-start h-full">
          <Button
            onClick={handleOpenSettings}
            size="icon"
            variant="outline"
            className="mr-2"
          >
            <Settings2Icon className="opacity-60" />
          </Button>
        </div>
      </CraftEmpty>
      <CraftNotEmpty>
        <div className="flex flex-col gap-2 justify-between items-end self-stretch">
          <Button
            size="icon"
            variant="outline"
            className="mr-2"
            onClick={handleOpenSettings}
          >
            <Settings2Icon />
          </Button>
          <Button
            event={{ type: "CLEAR" }}
            variant="ghost"
            className="mr-1 text-xs font-semibold px-1 h-10"
          >
            CLEAR
          </Button>
        </div>
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
  return snapshot.context.sessionSnapshot?.context.suggestedTokens || [];
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

export const MyRecipesBadge = () => {
  return (
    <div className="indicator">
      <ListIndicator />
      <Badge
        variant={"outline"}
        event={{ type: "VIEW_LIST" }}
        className="text-md font-semibold flex flex-row gap-1 whitespace-nowrap"
      >
        <ListIcon className="mr-2" />
        My Cookbook
      </Badge>
    </div>
  );
};

export const CurrentListButton = () => {
  return (
    <div className="indicator">
      <ListIndicator />
      <Button variant={"outline"} event={{ type: "VIEW_LIST" }} size="icon">
        <ListIcon />
      </Button>
    </div>
  );
};
