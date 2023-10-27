"use client";

import { Button } from "@/components/ui/button";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { useCommandState } from "cmdk";
import { ChevronRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export const ConjureAction = ({}: {}) => {
  const search = useCommandState((state) => state.search);
  const router = useRouter();

  const handlePress = useCallback(() => {
    const url = `/craft/suggestions${window.location.search}`;
    router.push(url);
  }, [router]);

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
