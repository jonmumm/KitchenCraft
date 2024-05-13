import { RecipeListItemLoading } from "@/app/recipe/components";

export default function Loading() {
  return (
    <div className="flex flex-col sm:gap-10 mt-0 sm:mt-10">
      <div className="px-4 mt-8 max-w-3xl w-full mx-auto">
        <h3 className="text-muted-foreground uppercase text-xs">
          Community Favorites
        </h3>
      </div>
      {new Array(8).fill(0).map((_, index) => {
        return <RecipeListItemLoading key={index} index={index} />;
      })}
    </div>
  );
}
