import { getRecipeStream$ } from "@/app/recipe/[slug]/observables";
import { Card } from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Skeleton } from "@/components/display/skeleton";
import { FirstValue } from "@/components/util/first-value";
import { Suspense } from "react";
import { twc } from "react-twc";
import { map } from "rxjs";
import { z } from "zod";
import { NewRecipeResultsView } from "../../components";
import {
  CraftInputting,
  CraftingPlacholder,
  RecipeCreating,
  RemixEmpty,
  RemixInputting,
} from "../../components.client";
import { LastValue } from "@/components/util/last-value";
import { getBaseRecipe } from "@/app/recipe/[slug]/queries";

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
  const slug = z.string().parse(params["slug"]);
  const { name, description } = await getBaseRecipe(slug);
  // const recipeData$ = await getBase$(slug);

  const Container = twc.div`flex flex-col gap-2 px-4 h-full max-w-3xl mx-auto w-full`;

  const CreatingView = () => <CraftingPlacholder />;

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
              {name}
            </div>
            <p className="line-clamp-4">{description}</p>
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
}
