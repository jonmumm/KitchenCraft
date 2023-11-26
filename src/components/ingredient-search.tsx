"use client";
import { KeyboardEventHandler, useCallback, useState } from "react";
import ingredients from "../data/ingredients.json";
import { Ingredient } from "@/types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/input/command";

export function IngredientSearch() {
  // todo next, add the statemachine
  const [searchTerm, setSearchTerm] = useState("");

  // Filter the ingredients based on the search term
  const filteredIngredients = ingredients.filter((ingredient) =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEnterPress: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      if (event.key === "Enter") {
        // Your logic here, e.g., trigger a search, etc.
        console.log("Enter key pressed!");
      }
    },
    []
  );

  // Group ingredients by category
  const groupedIngredients = filteredIngredients.reduce((acc, ingredient) => {
    if (!acc[ingredient.category]) {
      acc[ingredient.category] = [];
    }
    acc[ingredient.category].push(ingredient);
    return acc;
  }, {} as Record<string, Ingredient[]>);

  return (
    <Command className="rounded-lg border shadow-md">
      <CommandInput
        placeholder="Type an ingredient..."
        value={searchTerm}
        onKeyDown={handleEnterPress}
        onValueChange={setSearchTerm}
      />
      <CommandList>
        {searchTerm && !filteredIngredients.length && (
          <CommandEmpty>No ingredients found.</CommandEmpty>
        )}
        {Object.keys(groupedIngredients).map((category) => (
          <CommandGroup key={category} heading={category}>
            {groupedIngredients[category].map((ingredient) => (
              <CommandItem key={ingredient.name}>
                <span>{ingredient.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
}
