import { NewRecipeResultsView } from "./components";

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  return (
    <>
      {/* <CraftInputting> */}
      <NewRecipeResultsView />
      {/* </CraftInputting>

      <RecipeCreating>
        <div className="flex flex-col flex-1 justify-item items-center">
          Crafting ...
        </div>
      </RecipeCreating>
      <RecipeNavigating>
        <div className="flex flex-col flex-1 justify-item items-center">
          Navigating ...
        </div>
      </RecipeNavigating> */}
    </>
  );

  // return !isCreating ? (
  //   <div className="flex flex-col gap-2 px-4 h-full max-w-3xl mx-auto w-full">
  //     <Selections />
  //     {showResults ? (
  //       <>
  //         <div className="flex flex-row gap-2 flex-wrap mb-2">
  //           <div>
  //             <Badge variant="outline">Instant Pot</Badge>
  //           </div>
  //           <div>
  //             <Badge variant="outline">Slow Cookier</Badge>
  //           </div>
  //         </div>
  //         <Label className="text-xs text-muted-foreground uppercase font-semibold">
  //           Top Hit
  //         </Label>
  //         <InstantRecipeItem />
  //         <Label className="text-xs text-muted-foreground uppercase font-semibold mt-4">
  //           Suggestions
  //         </Label>
  //         {items.map((_, index) => {
  //           return <SuggestionItem key={index} index={index} />;
  //         })}
  //         <ClearResultsItem />
  //       </>
  //     ) : (
  //       <>
  //         <Label className="text-xs text-muted-foreground uppercase font-semibold mt-4">
  //           Trending
  //         </Label>
  //         <TrendingTags />
  //         {/* <TrendingIngredients /> */}
  //       </>
  //     )}
  //   </div>
  // ) : (
  //   <CraftingPlacholder />
  // );
}
