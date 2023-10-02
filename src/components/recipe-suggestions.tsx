"use client";

import { useSend } from "@/hooks/useSend";
import { useChat } from "ai/react";
import { CommandLoading } from "cmdk";
import { ChevronRightIcon } from "lucide-react";
import { useCallback } from "react";
import { Badge } from "./ui/badge";
import { CommandGroup, CommandItem } from "./ui/command";

export default function RecipeSuggestions({}: {}) {
  const send = useSend();
  const { messages, isLoading } = useChat({
    id: "suggestions",
    api: "/api/recipes",
  });

  const handleSelectItem = useCallback(
    (name: string, description: string) => {
      return () => {
        alert(name);
        console.log("SELECT!", { name, description });
        send({ type: "SELECT_RECIPE", name, description });
      };
    },
    [send]
  );

  const suggestions = messages[1]?.content;
  const items = suggestions
    ?.split("\n")
    .filter((item) => item.split(":").length === 2)
    .map((item) => item.split(":").map((f) => f.trim()));

  return (
    <>
      {items?.length > 0 && (
        <CommandGroup heading="Suggestions" className="max-h-50">
          {items.map(([name, description]) => {
            return (
              <CommandItem
                key={name}
                onSelect={handleSelectItem(name, description)}
              >
                <div className="flex flex-row gap-2 items-center justify-between">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {name}
                    </h3>
                    <p className="text-mg text-slate-700">{description}</p>
                  </div>
                  <ChevronRightIcon />
                </div>
              </CommandItem>
            );
            // return <CommandItem key={name}>{description}</CommandItem>;
          })}
        </CommandGroup>
      )}
      {isLoading && (
        <CommandLoading>
          <Badge variant={"outline"} className="p-3 m-3 font-semibold">
            🧪 Crafting more recipes ...
          </Badge>
        </CommandLoading>
      )}
    </>
  );
}
