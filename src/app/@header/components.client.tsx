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
import { useEventHandler } from "@/hooks/useEventHandler";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { getPlatformInfo } from "@/lib/device";
import { cn } from "@/lib/utils";
import { AppEvent } from "@/types";
import {
  ArrowLeftIcon,
  SendHorizontal,
  BookmarkIcon,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
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
  const actor = useContext(AppContext);
  const [initialValue] = useState(actor.getSnapshot().context.prompt);

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
      if (keyboardEvent.code == "Enter" && !keyboardEvent.shiftKey) {
        keyboardEvent.preventDefault();
        send({ type: "SUBMIT", name: "prompt" });
      }
      send({ type: "KEY_DOWN", keyboardEvent });
    },
    [send]
  );

  useEventHandler("PAGE_LOADED", () => {
    initialFocusRef.current = false;
  });

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
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground active:bg-transparent hover:bg-transparent self-start -mr-2"
        event={{ type: "NEW_RECIPE" }}
      >
        <ChevronRight />
      </Button>
    ) : (
      <div className="w-1 h-full"></div>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-row gap-2 items-end justify-between w-full relative",
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
          {/* <Button
            size="icon"
            variant="outline"
            className="mr-2 self-end"
            disabled
          >
            <ArrowUpIcon className="opacity-60" />
          </Button> */}
          {/* <Button
            onClick={handleOpenSettings}
            size="icon"
            variant="outline"
            className="mr-2"
          >
            <Settings2Icon className="opacity-60" />
          </Button> */}
        </div>
      </CraftEmpty>
      <div className="flex flex-col gap-2 justify-between items-end self-stretch">
        <CraftEmpty>
          <Button
            size="icon"
            variant="outline"
            className="mr-2 self-end"
            disabled
          >
            <SendHorizontal className="opacity-60" />
          </Button>
        </CraftEmpty>
        <CraftNotEmpty>
          <Button
            event={{ type: "SUBMIT", name: "prompt" }}
            size="icon"
            variant="outline"
            className="mr-2 self-end"
          >
            <SendHorizontal className="opacity-60" />
          </Button>
          <Button
            event={{ type: "CLEAR" }}
            variant="ghost"
            className="mr-2 text-xs font-semibold px-1 h-10"
            size="icon"
          >
            CLEAR
          </Button>
        </CraftNotEmpty>
      </div>
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
      <Link href="#liked">
        <Badge
          variant={"outline"}
          className="text-md font-semibold flex flex-row gap-1 whitespace-nowrap"
        >
          <BookmarkIcon className="m1-2" />
          Saved
        </Badge>
      </Link>
    </div>
  );
};
