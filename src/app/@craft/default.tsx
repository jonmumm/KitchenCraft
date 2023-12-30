import { Badge } from "@/components/display/badge";
import { Label } from "@/components/display/label";
import { Ideas, Selections, TrendingTags } from "./components";
import {
  ClearResultsItem,
  CraftCreating,
  CraftEmpty,
  CraftSearching,
  CraftingPlacholder,
  InstantRecipeItem,
  SuggestionItem,
} from "./components.client";
import { twc } from "react-twc";

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const items = new Array(6).fill(0);

  const Container = twc.div`flex flex-col gap-2 px-4 h-full max-w-3xl mx-auto w-full`;

  const EmptyStateView = () => (
    <Container>
      <TrendingTags />
      {/* <Ideas /> */}
    </Container>
  );

  const ResultsView = () => (
    <Container>
      {/* <Selections /> */}
      <Label className="text-xs text-muted-foreground uppercase font-semibold">
        Top Recipe
      </Label>
      <InstantRecipeItem />
      <Label className="text-xs text-muted-foreground uppercase font-semibold mt-4">
        Suggestions
      </Label>
      {items.map((_, index) => {
        return <SuggestionItem key={index} index={index} />;
      })}
      <ClearResultsItem />
    </Container>
  );

  const CreatingView = () => <CraftingPlacholder />;

  return (
    <>
      {/* <CraftEmpty>
        <EmptyStateView />
      </CraftEmpty> */}
      <CraftCreating>
        <CreatingView />
      </CraftCreating>
      <CraftSearching>
        <ResultsView />
      </CraftSearching>
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
