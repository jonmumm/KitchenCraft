// import { parseAsString } from "next-usequerystate";
import { Badge } from "@/components/display/badge";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import {
  createListBySlugSelector,
  createRecipeSelector,
} from "@/selectors/page-session.selectors";
import Link from "next/link";
import { useMemo } from "react";

export const RecipeAddedToast = ({
  addedRecipeId,
  listSlug,
}: {
  addedRecipeId: string;
  listSlug: string;
}) => {
  const selectList = useMemo(
    () => createListBySlugSelector(listSlug),
    [listSlug]
  );
  const list = usePageSessionSelector(selectList);

  const selectRecipe = useMemo(
    () => createRecipeSelector(addedRecipeId),
    [addedRecipeId]
  );
  const recipe = usePageSessionSelector(selectRecipe);

  return (
    <Link
      href={`?#${listSlug}`}
      className="flex flex-row items-center gap-2 w-full"
    >
      <span className="text-xl flex-shrink-0">
        {list?.icon ? <>{list.icon}</> : "#️⃣"}
      </span>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center text-muted-foreground text-sm">
          <span className="flex-shrink-0">Saved</span>
          <span className="truncate font-semibold mx-1 flex-1">
            {recipe?.name}
          </span>
          <span className="flex-shrink-0">to</span>
        </div>
        <span className="font-medium text-base underline truncate">
          #{listSlug}
        </span>
      </div>
      <Badge
        variant="secondary"
        className="flex-shrink-0"
        event={{
          type: "CHOOSE_LISTS",
          recipeId: addedRecipeId,
        }}
      >
        Change
      </Badge>
    </Link>
  );
};
