"use client";

import { CommandGroup, CommandItem } from "@/components/ui/command";
import { useQueryState } from "next-usequerystate";
import { ReactNode, useEffect } from "react";
import { ingredientsParser } from "./query-params";

export const RecipesGroup = ({ children }: { children?: ReactNode }) => {
  const [ingredients] = useQueryState("ingredients", ingredientsParser);

  //   useEffect(() => {
  //       if (ingredients && ingredients.length) {
  //         fetch(`/api/ingredients?prompt=${prompt}`)
  //           .then((resp) => resp.json())
  //           .then(z.array(z.string()).parse)
  //           .then(suggestions$.set);
  //       } else {
  //       }
  //   }, [ingredients]);

  return ingredients.length ? (
    <CommandGroup heading="Suggestions">
      <CommandItem>1</CommandItem>
      <CommandItem>2</CommandItem>
    </CommandGroup>
  ) : null;
};
