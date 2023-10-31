"use client";

import { Button } from "@/components/ui/button";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import scaleList from "@/data/serving-scalings.json";
import { ChevronRightIcon, PlusSquareIcon, ScaleIcon } from "lucide-react";
import {
  parseAsArrayOf,
  parseAsString,
  useQueryState,
} from "next-usequerystate";
import { useCallback } from "react";

export const scaleParser = parseAsArrayOf(parseAsString)
  .withOptions({ history: "push" })
  .withDefault([]);

export const ScaleGroup = () => {
  const [scale, setScale] = useQueryState("scale", scaleParser);
  //   const [prompt] = useQueryState("prompt", parseAsString);
  //   const [suggestions$] = useState(atom<string[]>(scaleList));

  const handleSelect = useCallback(
    (item: string) => {
      // Add item on select
      return () => {
        setScale([...scale, item]);
        // ingredients$.set([...ingredients$.get(), item]);
        // setSuggestions([]);
        //   setIngredients([...ingredients, item]);
        //   suggestions$.set([]);
        //   setPrompt(null);
        // prompt$.set("");
      };
    },
    [setScale, scale]
  );

  return (
    <CommandGroup heading="Scale">
      {scaleList.map((item) => {
        return (
          <CommandItem
            key={item}
            onSelect={handleSelect(item)}
            className="flex flex-row gap-1 py-2"
          >
            <span className="flex-1">{item}</span>
            <ChevronRightIcon />
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
};
