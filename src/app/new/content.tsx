"use client";

import RecipeIngredients from "@/components/recipe-ingredients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Command, CommandInput } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useEventHandler } from "@/hooks/useEventHandler";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { nanoid } from "ai";
import { useChat } from "ai/react";
import { Settings2Icon, XIcon } from "lucide-react";
import {
  KeyboardEventHandler,
  MouseEventHandler,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
// import { RecipeConfigurator } from "./recipe-configurator";
import { RecipeChatActor, RecipeChatContext } from "@/context/recipe-chat";
import RecipeSuggestions from "./suggestions";

export const Content = () => {
  return (
    <div className={`flex flex-col flex-end w-full p-4 pt-0`}>
      <RecipeChat />
    </div>
  );
};

export function RecipeChat() {
  const actor = useContext(RecipeChatContext);
  const isInputting = useSelector(actor, (state) => {
    return (
      state.matches("Status.New.Stage.WaitingForInput") ||
      state.matches("Status.New.Stage.Selecting")
    );
  });
  const isCreating = useSelector(actor, (state) => {
    return state.matches("Status.New.Stage.CreatingRecipe");
  });
  const isConfiguratorOpen = useSelector(actor, (state) =>
    state.matches("Configurator.Open")
  );
  const send = useSend();
  const handlePressClose = useCallback(() => {
    send({ type: "CLOSE_CONFIGURATOR" });
  }, [send]);

  return (
    <div className="flex flex-col gap-4">
      {isConfiguratorOpen && (
        <div className="flex flex-col gap-2">
          <Button onClick={handlePressClose} className="w-1/2 mx-auto">
            <XIcon />
            Close
          </Button>
          {/* <Card className={`flex flex-col bg-slate-50 mx-4`}>
            <RecipeConfigurator />
          </Card> */}
        </div>
      )}
      {isInputting && (
        <Card className={`flex flex-col flex-1`}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-row items-center gap-2">
              <RecipePromptLabel />
              {/* <ConfiguratorToggle /> */}
            </div>
            <div>
              <RecipeCommand />
            </div>
          </div>
        </Card>
      )}
      {isCreating && <RecipeCreating />}
    </div>
  );
}

const RecipeCreating = () => {
  const actor = useContext(RecipeChatContext);
  const name = useSelector(
    actor,
    (state) => state.context.currentSelection?.name
  );
  return (
    <div className="flex justify-center">
      <Badge variant="outline" className="p-4">
        🧪 Crafting {name}
      </Badge>
    </div>
  );
};

const ConfiguratorToggle = () => {
  const actor = useContext(RecipeChatContext);
  const open = useSelector(actor, (state) =>
    state.matches("Configurator.Open")
  );
  const send = useSend();

  const handlePressToggleConfigurator = useCallback(() => {
    send({ type: "TOGGLE_CONFIGURATOR" });
  }, [send]);

  return (
    <Button
      variant={open ? "default" : "outline"}
      className="w-16"
      onClick={handlePressToggleConfigurator}
    >
      <Settings2Icon className={!open ? "transform rotate-90" : ""} />
    </Button>
  );
};

const RecipePromptLabel = () => {
  const actor = useContext(RecipeChatContext);
  useSelector(actor, (state) => state.matches(""));

  return (
    <Label htmlFor="prompt" className="leading-5 w-full px-3 mt-4">
      <span>
        Enter <strong>ingredients</strong>, a dish <strong>name</strong> or{" "}
        <strong>description</strong>.
      </span>
    </Label>
  );
};

const RecipeCommand = () => {
  const actor = useContext(RecipeChatContext);
  const isSelecting = useSelector(actor, (state) =>
    state.matches("Status.New.Stage.Selecting")
  );
  return (
    <Command shouldFilter={false} className="pb-4">
      <div className="flex flex-col gap-3">
        <ChatInput />
        <TrendingKeywords />
        <ChatSubmit />
      </div>
      {isSelecting && <RecipeSuggestions />}
    </Command>
  );
};

const TrendingKeywords = () => {
  return (
    <div className="flex flex-col gap-2 p-4">
      <Label className="text-xs uppercase font-semibold text-muted-foreground">
        Trending
      </Label>
      <div className="w-full flex flex-row flex-wrap gap-1">
        <Badge variant="outline">Kabocha Squash</Badge>
        <Badge variant="outline">Chocolate Chip Cookies</Badge>
        <Badge variant="outline">feta</Badge>
        <Badge variant="outline">Delicata Squash</Badge>
        <Badge variant="outline">Pumpkin</Badge>
      </div>
    </div>
  );
};

const ChatSubmit = forwardRef((props, ref) => {
  const actor = useContext(RecipeChatContext);
  const send = useSend();
  const isTouched = useSelector(actor, (s) =>
    s.matches("Status.New.TouchState.Touched")
  );
  const visible = useSelector(
    actor,
    (s) => !s.matches("Status.New.Suggesting")
  );
  const chatId = useSelector(actor, (state) => state.context.chatId);
  const { setMessages, isLoading, reload } = useChat({
    id: "suggestions",
    api: `/api/chat/${chatId}/suggestions`,
  });

  const handlePress: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      const value = actor.getSnapshot().context.promptInput;
      e.preventDefault();
      send({ type: "SUBMIT" });
      setMessages([
        {
          id: nanoid(),
          role: "user",
          content: value,
        },
      ]);
      reload();
    },
    [actor, send, setMessages, reload]
  );

  if (!visible) {
    return null;
  }

  return (
    <Button
      disabled={!isTouched || isLoading}
      onClick={handlePress}
      size="lg"
      className="m-4 mt-1"
    >
      🧪 Conjure (6) New Ideas
    </Button>
  );
});
ChatSubmit.displayName = Button.displayName;

/**
 * On iOS when user opens keyboard, it causes the scroll
 * window to jump to a place so the text box is invisible
 * This circumvents that by jumping to top scroll anytime
 * viewprt changes
 */
// const ChatScrollFollow = () => {
//   const { vh } = useViewport();

//   useEffect(() => {
//     // alert(vh);
//     window.scrollTo(0, 0);
//   }, [vh]);
//   return null;
// };

const ChatInput = () => {
  const actor = useContext(RecipeChatContext);
  const chatId = useSelector(actor, (state) => state.context.chatId);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isLoading, setMessages, reload } = useChat({
    id: "suggestions",
    api: `/api/chat/${chatId}/suggestions`,
  });
  const isVisible = useSelector(
    actor,
    (state) => !state.matches("Status.New.Suggesting")
  );
  const value = useSelector(actor, (state) => state.context.promptInput);
  const send = useSend();

  const handleValueChange = useCallback(
    (value: string) => {
      send({ type: "SET_INPUT", value });
    },
    [send]
  );

  const handleFocus = useCallback(() => {
    send({ type: "FOCUS_PROMPT" });

    // hack to update scroll after layout change
    // to fix safari keyboard issue
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 100);
  }, [send]);

  const handleBlur = useCallback(() => {
    send({ type: "BLUR_PROMPT" });
  }, [send]);

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const value = e.currentTarget.value;
      if (e.key === "Enter" && value && value !== "") {
        e.preventDefault();
        send({ type: "SUBMIT" });
        setMessages([
          {
            id: nanoid(),
            role: "user",
            content: value,
          },
        ]);
        reload();
      }
    },
    [send, setMessages, reload]
  );

  useEffect(() => {
    if (isVisible) {
      inputRef.current?.focus();
    }
  }, [isVisible, inputRef]);

  const focusPrompt = useCallback(() => {
    inputRef.current?.focus();
  }, [inputRef]);
  useEventHandler("START_OVER", focusPrompt);

  return (
    <CommandInput
      ref={inputRef}
      disabled={isLoading}
      name="prompt"
      value={value}
      onValueChange={handleValueChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder="(e.g. leftover pizza, eggs and feta)"
    />
  );
};
ChatInput.displayName = CommandInput.displayName;
