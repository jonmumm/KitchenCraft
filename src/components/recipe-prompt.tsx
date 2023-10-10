"use client";

import { PromptContext } from "@/context/prompt";
import { useChat } from "ai/react";
import { KeyboardEventHandler, useCallback, useContext, useRef } from "react";
import { RecipeConfigurator } from "./recipe-configurator";
import RecipeIngredients from "./recipe-ingredients";
import { Card } from "./ui/card";
import { Command, CommandInput } from "./ui/command";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";

export function RecipePrompt() {
  return (
    <Card className={`flex flex-col bg-slate-50 max-h-full m-4`}>
      <div className="p-3 flex flex-col gap-4">
        <div className="flex flex-row items-center gap-2">
          <Label htmlFor="prompt" className="leading-5 w-full">
            <span>
              Enter <strong>ingredients</strong> or <strong>recipe</strong>
              <br />
              to get suggestions.
            </span>
          </Label>
          <RecipeConfigurator />
        </div>
        <div>
          <RecipeCommand />
        </div>
      </div>
    </Card>
  );
}

const RecipeCommand = () => {
  const promptRef = useRef<HTMLInputElement>(null);
  const prompt$ = useContext(PromptContext);
  const { input, isLoading, setInput, append } = useChat({
    id: "suggestions",
    api: "/api/recipes",
  });

  const handleFocus = useCallback(() => {
    prompt$.setKey("focused", true);
  }, [prompt$]);

  const handleBlur = useCallback(() => {
    prompt$.setKey("focused", false);
  }, [prompt$]);

  const isSelecting = false;

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const value = promptRef.current?.value;
      if (e.key === "Enter" && value && value !== "") {
        e.preventDefault();
        prompt$.setKey("text", value);
        append({ content: value, role: "user" });
        promptRef.current.value = "";
      }
    },
    [prompt$, append]
  );

  const focusPrompt = useCallback(() => {
    console.log("FOCUS");
    setTimeout(() => {
      promptRef.current?.focus();
    }, 10);
  }, [promptRef]);

  return (
    <Command shouldFilter={false}>
      <RecipeIngredients />
      <CommandInput
        ref={promptRef}
        name="prompt"
        disabled={isLoading}
        value={input}
        onValueChange={setInput}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="(e.g. leftover pizza, eggs and feta)"
      />
      {isSelecting && (
        <ScrollArea style={{ maxHeight: "50vh" }}>
          {/* <RecipeSuggestions /> */}
        </ScrollArea>
      )}
    </Command>
  );
};

// function RecipeSuggestion({
//   name,
//   description,
// }: {
//   name: string;
//   description: string;
// }) {}
