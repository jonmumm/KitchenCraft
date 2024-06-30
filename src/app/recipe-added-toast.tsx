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
      {list?.icon ? <>{list.icon}</> : "👍"}
    </span>
    <div className="flex flex-col flex-1 min-w-0">
      <div className="flex items-center text-sm">
        <span className="font-medium flex-shrink-0 whitespace-nowrap">Saved</span>
        <span className="truncate font-semibold mx-1 min-w-0">
          {recipe?.name}
        </span>
        <span className="flex-shrink-0 whitespace-nowrap">to</span>
      </div>
      <span className="font-medium text-base text-blue-600 hover:underline truncate">
        #{listSlug}
      </span>
    </div>
    <Badge
      variant="secondary"
      className="flex-shrink-0 ml-2"
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
