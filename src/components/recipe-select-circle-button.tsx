import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { cn } from "@/lib/utils";
import { createRecipeIsSelectedSelector } from "@/selectors/page-session.selectors";
import { CheckIcon } from "lucide-react";
import { useMemo } from "react";
import { Button } from "./input/button";

export const RecipeSelectCircleButton = ({
  id,
}: {
  id: string | undefined;
}) => {
  const selectItemIsSelected = useMemo(
    () => createRecipeIsSelectedSelector(id),
    [id]
  );
  const isSelected = usePageSessionSelector(selectItemIsSelected);

  return (
    <Button
      event={
        id
          ? !isSelected
            ? { type: "SELECT_RECIPE", id: id }
            : { type: "UNSELECT", id: id }
          : undefined
      }
      className={cn(
        "rounded-full",
        isSelected ? "border-purple-700 border-2 border-solid" : ""
      )}
      variant="outline"
      size="icon"
    >
      <CheckIcon className={!isSelected ? "hidden" : "block"} />
    </Button>
  );
};
