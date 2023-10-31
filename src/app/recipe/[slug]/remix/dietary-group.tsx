"use client";

import { CommandGroup, CommandItem } from "@/components/ui/command";
import dietaryList from "@/data/dietary.json";
import { PlusSquareIcon } from "lucide-react";
import {
  parseAsArrayOf,
  parseAsString,
  useQueryState,
} from "next-usequerystate";
import { useCallback } from "react";

export const dietaryParser = parseAsArrayOf(parseAsString)
  .withOptions({ history: "push" })
  .withDefault([]);

export const DietaryGroup = () => {
  const [dietary, setDietary] = useQueryState("dietary", dietaryParser);
  //   const [prompt] = useQueryState("prompt", parseAsString);
  //   const [suggestions$] = useState(atom<string[]>(dietaryList));

  const handleSelect = useCallback(
    (item: string) => {
      // Add item on select
      return () => {
        setDietary([...dietary, item]);
        // ingredients$.set([...ingredients$.get(), item]);
        // setSuggestions([]);
        //   setIngredients([...ingredients, item]);
        //   suggestions$.set([]);
        //   setPrompt(null);
        // prompt$.set("");
      };
    },
    [setDietary, dietary]
  );

  return (
    <CommandGroup heading="Dietary">
      {dietaryList.map((item) => {
        return (
          <CommandItem key={item} onSelect={handleSelect(item)}>
            <span className="flex-1">{item}</span>
            <PlusSquareIcon className="opacity-50" />
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
};
