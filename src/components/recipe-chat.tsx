"use client";

import { RecipeConfigurator } from "@/components/recipe-configurator";
import RecipeIngredients from "@/components/recipe-ingredients";
import RecipeSuggestions from "@/components/recipe-suggestions";
import { Card } from "@/components/ui/card";
import { Command, CommandInput } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PromptContext } from "@/context/prompt";
import { useSelector } from "@/hooks/useSelector";
import { RecipeChatActor } from "@/machines/recipe-chat";
import { useChat } from "ai/react";
import {
  KeyboardEventHandler,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useRef,
} from "react";

export const RecipeChatContext = createContext({} as RecipeChatActor);

export function RecipeChat() {
  const actor = useContext(RecipeChatContext);

  return (
    <Card className={`flex flex-col bg-slate-50 max-h-full m-4`}>
      <div className="p-3 flex flex-col gap-4">
        <div className="flex flex-row items-center gap-2">
          <RecipePromptLabel />
          <RecipeConfigurator />
        </div>
        <div>
          <RecipeCommand />
        </div>
      </div>
    </Card>
  );
}

const RecipePromptLabel = () => {
  const actor = useContext(RecipeChatContext);
  useSelector(actor, (state) => state.matches(""));

  return (
    <Label htmlFor="prompt" className="leading-5 w-full">
      <span>
        Search <strong>ingredients</strong> or <strong>dish name</strong>.
        Modify the <strong>recipe</strong> along the way.
      </span>
    </Label>
  );
};

const RecipeCommand = () => {
  return (
    <Command shouldFilter={false}>
      <RecipeIngredients />
      <RecipeInput />
      <ScrollArea style={{ maxHeight: "50vh" }}>
        <RecipeSuggestions />
      </ScrollArea>
    </Command>
  );
};

const RecipeInput = forwardRef((props, ref) => {
  const promptRef = useRef<HTMLInputElement>(null);
  const prompt$ = useContext(PromptContext);
  const { input, setInput, append } = useChat({
    id: "suggestions",
    api: "/api/recipes",
  });

  const handleFocus = useCallback(() => {
    prompt$.setKey("focused", true);
  }, [prompt$]);

  const handleBlur = useCallback(() => {
    prompt$.setKey("focused", false);
  }, [prompt$]);

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const value = promptRef.current?.value;
      if (e.key === "Enter" && value && value !== "") {
        e.preventDefault();
        console.log("setting", value);
        prompt$.setKey("text", value);
        console.log({ value });
        append({ content: value, role: "user" });
        promptRef.current.value = "";
      }
    },
    [prompt$, append]
  );
  return (
    <CommandInput
      ref={promptRef}
      name="prompt"
      value={input}
      onValueChange={setInput}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder="(e.g. leftover pizza, eggs and feta)"
    />
  );
});
RecipeInput.displayName = CommandInput.displayName;
