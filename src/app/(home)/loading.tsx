import { RecipeListItemLoading } from "@/app/recipe/components";

export default function Loading() {
  return (
    <div className="flex flex-col sm:gap-10 mt-0 sm:mt-10">
      {new Array(8).fill(0).map((_, index) => {
        return <RecipeListItemLoading key={index} index={index} />;
      })}
    </div>
  );
}
