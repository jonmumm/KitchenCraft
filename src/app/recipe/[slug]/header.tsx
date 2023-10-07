"use client";

import { RecipeChatContext } from "@/components/recipe-chat";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSelector } from "@/hooks/useSelector";
import { PrinterIcon, SaveIcon } from "lucide-react";
import { useCallback, useContext } from "react";

export default function Header() {
  const actor = useContext(RecipeChatContext);
  const name = useSelector(actor, (state) => state.context.recipe.name);
  const description = useSelector(
    actor,
    (state) => state.context.recipe.description
  );
  const handlePressPrint = useCallback(() => {
    window.print();
  }, []);
  const handlePressSave = useCallback(() => {
    window.alert("Save not yet implemented");
  }, []);

  return (
    <div className="flex justify-center gap-2">
      <Card className="p-3 flex flex-row gap-2 items-end">
        <h1 className="text-3xl font-semibold">{name}</h1>
        <p className="text-md">{description}</p>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={handlePressPrint}
            className="flex flex-row gap-1"
          >
            <PrinterIcon />
            <span>Print</span>
          </Button>
          <Button
            variant="outline"
            onClick={handlePressSave}
            className="flex flex-row gap-1"
          >
            <SaveIcon />
            <span>Save</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
