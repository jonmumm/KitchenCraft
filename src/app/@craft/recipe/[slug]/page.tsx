import { Badge } from "@/components/display/badge";
import { Card } from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import KeyboardAvoidingView from "@/components/layout/keyboard-avoiding-view";
import { ChevronLeft, ChevronRightIcon, XIcon } from "lucide-react";
import { getRecipeStream$ } from "@/app/recipe/[slug]/observables";
import { ReactNode, Suspense } from "react";
import { twc } from "react-twc";
import { z } from "zod";
import { TrendingTags } from "../../components";
import {
  CraftEmpty,
  CraftInputting,
  CraftNotEmpty,
  CraftingPlacholder,
  InstantRecipeItem,
  RecipeCreating,
  RemixEmpty,
  RemixInputting,
  SuggestionItem,
} from "../../components.client";
import { FirstValue } from "@/components/util/first-value";
import { map } from "rxjs";

type Props = {
  params: { slug: string };
};

export default async function Page({
  params,
  searchParams,
}: {
  params: Record<string, string>;
  searchParams: Record<string, string>;
}) {
  const items = new Array(6).fill(0);
  const slug = z.string().parse(params["slug"]);
  const recipeData$ = await getRecipeStream$(slug);

  const Container = twc.div`flex flex-col gap-2 px-4 h-full max-w-3xl mx-auto w-full`;

  const EmptyStateView = () => (
    <Container>
      <TrendingTags />
      {/* <Ideas /> */}
    </Container>
  );

  const SubmitButton = () => {
    return (
      <Button className="w-full" size="lg">
        Submit <ChevronRightIcon />
      </Button>
    );
  };

  const BackButton = () => {
    return (
      <div className="flex flex-row justify-center pointer-events-none py-4">
        <Badge
          event={{ type: "BACK" }}
          className="pointer-events-auto px-3 py-2"
        >
          <ChevronLeft size={14} />
           Back
        </Badge>
      </div>
    );
  };

  const ClearButton = () => {
    return (
      <div className="flex flex-row justify-center pointer-events-none py-4">
        <Badge
          event={{ type: "CLEAR" }}
          className="pointer-events-auto px-3 py-2"
        >
           Clear
          <XIcon size={14} />
        </Badge>
      </div>
    );
  };

  const Footer = ({ children }: { children: ReactNode }) => {
    return <KeyboardAvoidingView>{children}</KeyboardAvoidingView>;
  };

  const NewRecipeResultsView = () => (
    <>
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
        {/* <ClearResultsItem /> */}
        {/* <BackButton /> */}
      </Container>
      <Footer>
        <CraftEmpty>
          <BackButton />
        </CraftEmpty>
        <CraftNotEmpty>
          <ClearButton />
        </CraftNotEmpty>
      </Footer>
    </>
  );

  const CreatingView = () => <CraftingPlacholder />;

  // const recipe$ = from(getRecipe(slug)).pipe(shareReplay(1));

  const RemixSuggestionsView = () => (
    <>
      <Container>
        <Label className="text-xs text-muted-foreground uppercase font-semibold">
          Remixing
        </Label>
        <Card>
          {/* <Avatar className="opacity-20">
        <AvatarFallback>{index + 1}.</AvatarFallback>
      </Avatar> */}
          <div className="flex flex-col gap-2 p-3 w-full sm:flex-row">
            <div className="sm:basis-60 sm:flex-shrink-0 font-semibold">
              <Suspense fallback={<Skeleton className="w-8 h-8" />}>
                <FirstValue
                  observable={recipeData$.pipe(
                    map((recipe) => recipe?.name || "...")
                  )}
                />
              </Suspense>
              {/* {name ? name : <Skeleton className="w-2/3 sm:w-full h-7" />} */}
            </div>
            <Suspense
              fallback={
                <div className="flex flex-col gap-1 w-full">
                  <Skeleton className="w-full h-5" />
                  <Skeleton className="w-full h-5" />
                  <Skeleton className="w-full h-5" />
                </div>
              }
            >
              <p className="line-clamp-4">
                <FirstValue
                  observable={recipeData$.pipe(
                    map((recipe) => recipe?.description || "...")
                  )}
                />
              </p>
            </Suspense>
            {/* {description ? (
          <p className="line-clamp-4">{description}</p>
        ) : (
          <div className="flex flex-col gap-1 w-full">
            <Skeleton className="w-full h-5" />
            <Skeleton className="w-full h-5" />
            <Skeleton className="w-full h-5" />
          </div>
        )} */}
          </div>
          {/* <div className="w-24 flex flex-row justify-center"> */}
          {/* <Button event={{ type: "INSTANT_RECIPE" }} variant="ghost" size="icon"> */}
          {/* <InstantRecipeIcon /> */}
          {/* </Button> */}
          {/* </div> */}
          {/* <Badge className="opacity-20">Craft</Badge> */}
        </Card>
      </Container>
    </>
  );

  const RemixPreviewResultView = () => <>Preview Result</>;

  return (
    <>
      <CraftInputting>
        <NewRecipeResultsView />
      </CraftInputting>

      <RecipeCreating>
        <CreatingView />
      </RecipeCreating>

      <RemixEmpty>
        <RemixSuggestionsView />
      </RemixEmpty>
      <RemixInputting>
        <RemixPreviewResultView />
      </RemixInputting>
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
