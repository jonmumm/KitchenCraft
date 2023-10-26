"use client";

import { Button } from "@/components/ui/button";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { useCommandState } from "cmdk";
import { ChevronRightIcon } from "lucide-react";
import { useCallback } from "react";

export const ConjureAction = ({
  action,
}: {
  action: (prompt: string) => Promise<void>;
}) => {
  const search = useCommandState((state) => state.search);

  const handlePress = useCallback(() => {
    action(search);
  }, [search, action]);

  return (
    search !== "" && (
      <CommandGroup heading="Actions">
        <CommandItem>
          <Button
            onClick={handlePress}
            variant="ghost"
            size="fit"
            className="flex flex-row gap-3 items-center justify-between w-full p-3"
          >
            <div className="w-16 aspect-square">
              <div className="flex justify-center items-center w-full h-full rounded-sm bg-muted-foreground">
                🧪
              </div>
            </div>
            <span className="flex-1">
              <span className="font-semibold">Conjure (6)</span> recipes for{" "}
              <span className="italic">{search}</span>
            </span>
            <ChevronRightIcon />
          </Button>
        </CommandItem>
      </CommandGroup>
    )
  );
};
