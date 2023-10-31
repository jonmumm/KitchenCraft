"use client";

import { Button } from "@/components/ui/button";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { useCommandState } from "cmdk";
import { ChevronRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useCallback } from "react";
import { AddedIngredientsSection } from "../added-ingredients-section";
import { useQueryState } from "next-usequerystate";
import { ingredientsParser, tagsParser } from "../query-params";
import { Badge } from "@/components/ui/badge";

export const ActionsGroup = ({ children }: { children?: ReactNode }) => {
  const search = useCommandState((state) => state.search);
  const [ingredients] = useQueryState("ingredients", ingredientsParser);
  return ingredients.length || search !== "" ? (
    <CommandGroup heading="Actions">{children}</CommandGroup>
  ) : null;
};

export const AddIngredientAction = ({ children }: { children: ReactNode }) => {
  return <CommandItem value="add-ingredient">{children}</CommandItem>;
};

export const AddIngredientItem = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export const ConjureIdeasAction = () => {
  const search = useCommandState((state) => state.search);
  const router = useRouter();
  const [tags] = useQueryState("tags", tagsParser);
  const [ingredients] = useQueryState("ingredients", ingredientsParser);

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
            <span className="font-semibold">Conjure (6)</span> recipe ideas
          </h6>
          <span className="italic text-xs opacity-70">{search}</span>
          <div className="flex flex-row gap-1 flex-wrap">
            {tags.map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
            {ingredients.map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </div>
        </div>
        <ChevronRightIcon />
      </Button>
    </CommandItem>
  );
};

// export const TipsAction = () => {
//   const search = useCommandState((state) => state.search);
//   const router = useRouter();

//   const handlePress = useCallback(() => {
//     const url = `/craft/suggestions${window.location.search}`;
//     router.push(url);
//   }, [router]);
//   return (
//     <CommandItem value="recipe-ideas">
//       <Button
//         onClick={handlePress}
//         variant="ghost"
//         size="fit"
//         className="flex flex-row gap-3 items-center justify-between w-full p-3"
//       >
//         <div className="w-16 aspect-square">
//           <div className="flex justify-center items-center w-full h-full rounded-sm bg-muted-foreground">
//             🧪
//           </div>
//         </div>
//         <span className="flex-1">
//           <span className="font-semibold">Conjure (6)</span> recipes for{" "}
//           <span className="italic">{search}</span>
//         </span>
//         <ChevronRightIcon />
//       </Button>
//     </CommandItem>
//   );
// };
