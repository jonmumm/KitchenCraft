import { getBaseRecipe } from "@/app/recipe/[slug]/queries";
import { Card } from "@/components/display/card";
import { Label } from "@/components/display/label";
import { twc } from "react-twc";
import { z } from "zod";
import { NewRecipeResultsView } from "../../components";
import {
  CraftInputting,
  CraftingPlacholder,
  RecipeCreating,
  RemixEmpty,
  RemixInputting,
} from "../../components.client";

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
          <div className="flex flex-col gap-2 p-3 w-full sm:flex-row">
            <div className="sm:basis-60 sm:flex-shrink-0 font-semibold">
              {name}
            </div>
            <p className="line-clamp-4">{description}</p>
          </div>
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
