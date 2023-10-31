"use client";

import { Button } from "@/components/ui/button";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { useCommandState } from "cmdk";
import { ChevronRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export const ActionGroup = () => {
  const search = useCommandState((state) => state.search);
  return search.length ? (
    <CommandGroup heading="Actions">
      <MyAction />
    </CommandGroup>
  ) : null;
};

export const MyAction = () => {
  const search = useCommandState((state) => state.search);
  const router = useRouter();
  //   const [tags] = useQueryState("tags", tagsParser);
  //   const [ingredients] = useQueryState("ingredients", ingredientsParser);

  const handlePress = useCallback(() => {
    const url = `/craft/suggestions${window.location.search}`;
    router.push(url);
  }, [router]);

  return (
    <CommandItem value="recipe-ideas" onSelect={handlePress} className="p-0">
      <Button
        variant="ghost"
        size="fit"
        className="flex flex-row gap-3 items-center justify-between p-3"
      >
        <div className="w-10 aspect-square">
          <div className="flex justify-center items-center w-full h-full rounded-sm">
            🧪
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-1 items-start">
          <h6>
            <span className="font-semibold">Remix</span>
          </h6>
          <span className="italic text-xs opacity-70">{search}</span>
          <div className="flex flex-row gap-1 flex-wrap">
            {/* {tags.map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
            {ingredients.map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))} */}
          </div>
        </div>
        <ChevronRightIcon />
      </Button>
    </CommandItem>
  );
};
