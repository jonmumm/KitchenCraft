"use client";

import { CommandGroup, CommandItem } from "@/components/ui/command";
import equipmentList from "@/data/equipment.json";
import { PlusSquareIcon } from "lucide-react";
import {
  parseAsArrayOf,
  parseAsString,
  useQueryState,
} from "next-usequerystate";
import { useCallback } from "react";

export const equipmentParser = parseAsArrayOf(parseAsString)
  .withOptions({ history: "push" })
  .withDefault([]);

export const EquipmentGroup = () => {
  const [equipment, setEquipment] = useQueryState("equipment", equipmentParser);

  const handleSelect = useCallback(
    (item: string) => {
      // Add item on select
      return () => {
        setEquipment([...equipment, item]);
        // ingredients$.set([...ingredients$.get(), item]);
        // setSuggestions([]);
        //   setIngredients([...ingredients, item]);
        //   suggestions$.set([]);
        //   setPrompt(null);
        // prompt$.set("");
      };
    },
    [setEquipment, equipment]
  );
  return (
    <CommandGroup heading="Equipment">
      {equipmentList.map((item) => {
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
