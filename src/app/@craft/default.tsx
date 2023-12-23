"use client";

import { Card } from "@/components/display/card";
import { Label } from "@/components/display/label";
import { useSelector } from "@/hooks/useSelector";
import {
  Creating,
  InstantRecipeItem,
  SuggestionItem,
} from "./components.client";
import { useCraftContext } from "./hooks";

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const items = new Array(6).fill(0);
  const actor = useCraftContext();

  const isCreating = useSelector(
    actor,
    (state) => !state.matches("Creating.False")
  );

  return !isCreating ? (
    <div className="max-w-3xl w-full mx-auto flex flex-col gap-2 px-4 h-full">
      <Label className="text-xs text-muted-foreground uppercase font-semibold">
        Top Hit
      </Label>
      <InstantRecipeItem />
      <Label className="text-xs text-muted-foreground uppercase font-semibold mt-4">
        Suggestions
      </Label>
      {items.map((_, index) => {
        return <SuggestionItem key={index} index={index} />;
      })}
    </div>
  ) : (
    <Creating />
  );
}
