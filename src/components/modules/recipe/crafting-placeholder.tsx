"use client";

import { CraftContext } from "@/app/context";
import { Card } from "@/components/display/card";
import { EllipsisAnimation } from "@/components/feedback/ellipsis-animation";
import { useSelector } from "@/hooks/useSelector";
import { useContext } from "react";

export const RecipeCraftingPlaceholder = ({
  name,
  description,
}: {
  name?: string;
  description?: string;
}) => {
  const actor = useContext(CraftContext);
  const selection = useSelector(actor, (state) => state.context.selection);

  return (
    <div className="flex flex-col gap-2 max-w-xl mx-auto">
      <Card className="flex flex-col gap-2 pb-5 mx-3">
        <div className="flex flex-row gap-3 p-5 justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">
              {name || selection?.name}
            </h1>
            <p className="text-lg text-muted-foreground">
              {description || selection?.description}
            </p>
          </div>
        </div>
      </Card>
      <div className="flex flex-col gap-1 items-center w-full mt-8">
        <p className="animate-pulse">Crafting</p>
        <EllipsisAnimation />
      </div>
    </div>
  );
};
