"use client";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { useStore } from "@nanostores/react";
import { PlusSquareIcon } from "lucide-react";
import { atom } from "nanostores";
import { parseAsString, useQueryState } from "next-usequerystate";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { ingredientsParser } from "./query-params";

export const IngredientsGroup = ({}: {}) => {
  const [suggestions$] = useState(atom<string[]>([]));
  //   const ingredients = useStore(ingredients$);

  const SuggestionsFetcher = () => {
    const [prompt] = useQueryState("prompt", parseAsString);

    useEffect(() => {
      if (prompt && prompt.length) {
        fetch(`/api/ingredients?prompt=${prompt}`)
          .then((resp) => resp.json())
          .then(z.array(z.string()).parse)
          .then(suggestions$.set);
      } else {
        suggestions$.set([]);
      }
    }, [prompt]);

    return <></>;
  };

  const SuggestionsList = () => {
    const [ingredients, setIngredients] = useQueryState(
      "ingredients",
      ingredientsParser
    );
    const [prompt, setPrompt] = useQueryState("prompt", parseAsString);
    const handleSelect = useCallback(
      (item: string) => {
        // Add item on select
        return () => {
          // ingredients$.set([...ingredients$.get(), item]);
          // setSuggestions([]);
          setIngredients([...ingredients, item]);
          suggestions$.set([]);
          setPrompt(null);
          // prompt$.set("");
        };
      },
      [setIngredients, ingredients, setPrompt]
    );

    const suggestions = useStore(suggestions$);
    return suggestions.length || prompt ? (
      <CommandGroup heading="Ingredients">
        {suggestions.map((item) => {
          const promptLength = prompt?.length!;
          const matchIndex = item.toLowerCase().indexOf(prompt?.toLowerCase()!);

          const startToken = item.slice(0, matchIndex);
          const midToken = item.slice(matchIndex, matchIndex + promptLength);
          const endToken = item.slice(matchIndex + promptLength);

          return (
            <CommandItem
              key={item}
              onSelect={handleSelect(item)}
              className="flex flex-row"
            >
              <span className="flex-1">
                <span>{startToken}</span>
                <span className="font-bold">{midToken}</span>
                <span>{endToken}</span>
              </span>
              <PlusSquareIcon className="opacity-50" />
            </CommandItem>
          );
        })}
        {prompt && (
          <CommandItem
            onSelect={handleSelect(prompt)}
            className="flex flex-row"
          >
            <span className="flex-1">
              <span className="italic">Add ingredient</span> &apos;
              <span className="font-bold">{prompt}</span>&apos;
            </span>
            <PlusSquareIcon className="opacity-50" />
          </CommandItem>
        )}
      </CommandGroup>
    ) : null;
  };

  return (
    <>
      <SuggestionsFetcher />
      <SuggestionsList />
    </>
  );
};
