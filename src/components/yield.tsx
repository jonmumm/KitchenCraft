import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { Skeleton } from "./display/skeleton";

export const Yield = ({ recipeId }: { recipeId?: string }) => {
  const val = usePageSessionSelector((state) =>
    recipeId ? state.context.recipes?.[recipeId]?.yield : undefined
  );
  if (!recipeId) {
    return (
      <div className="flex flex-row gap-1">
        <Skeleton className="w-4 h-4" />
        <Skeleton className="w-10 h-4" />
      </div>
    );
  }
  if (!val) {
    return (
      <div className="flex flex-row gap-1">
        <Skeleton className="w-4 h-4" />
        <Skeleton className="w-10 h-4" />
      </div>
    );
  }

  return <>{val}</>;
};
