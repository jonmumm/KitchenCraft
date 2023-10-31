"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { XIcon } from "lucide-react";
import { useQueryState } from "next-usequerystate";
import { useCallback } from "react";
import { ingredientsParser } from "./query-params";

const AddedIngredientsList = () => {
  const [ingredients, setIngredients] = useQueryState(
    "ingredients",
    ingredientsParser
  );

  const handlePressItem = useCallback(
    (item: string) => {
      return () => {
        const params = new URLSearchParams(window.location.search);
        const ingredients = (params.get("ingredients")?.split(",") || []).map(
          (item) => decodeURIComponent(item)
        );

        const nextIngredients = ingredients.filter(
          (ingredient) => ingredient !== item
        );
        if (nextIngredients.length) {
          setIngredients(nextIngredients);
        } else {
          setIngredients(null);
        }
      };
    },
    [setIngredients]
  );

  return (
    <div className="flex flex-row gap-1 flex-wrap">
      {ingredients &&
        ingredients.map((item) => {
          return (
            <Badge
              onClick={handlePressItem(item)}
              key={item}
              variant="secondary"
              className="flex flex-row gap-1"
            >
              {item}
              <XIcon size={18} />
            </Badge>
          );
        })}
    </div>
  );
};

export const AddedIngredientsSection = () => {
  const [ingredients] = useQueryState("ingredients", ingredientsParser);

  return ingredients?.length ? (
    <div className="px-5">
      <Label className="text-muted-foreground uppercase text-xs">
        Ingredients
      </Label>
      <AddedIngredientsList />
    </div>
  ) : null;
};
