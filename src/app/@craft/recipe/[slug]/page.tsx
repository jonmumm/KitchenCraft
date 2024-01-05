import { getBaseRecipe } from "@/app/recipe/[slug]/queries";
import SubjectGenerator from "@/components/ai/subject-generator";
import { Card } from "@/components/display/card";
import { Label } from "@/components/display/label";
import { getRecipe } from "@/db/queries";
import { assert } from "@/lib/utils";
import { SuggestionPredictionOutputSchema } from "@/schema";
import { SuggestionPredictionPartialOutput } from "@/types";
import { twc } from "react-twc";
import { ReplaySubject, filter, map, takeUntil, takeWhile } from "rxjs";
import { z } from "zod";
import { NewRecipeResultsView } from "../../components";
import {
  CraftInputting,
  CraftingPlacholder,
  RecipeCreating,
  RemixEmpty,
  RemixInputting,
  ResultCard,
} from "../../components.client";
import { RemixSuggestionsTokenStream } from "./remix-suggestions/stream";
import { LastValue } from "@/components/util/last-value";
import { Suspense } from "react";
import { Skeleton } from "@/components/display/skeleton";

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
  const recipe = await getRecipe(slug);
  assert(recipe, "expected recipe");
  const { name, description } = await getBaseRecipe(slug);
  // const recipeData$ = await getBase$(slug);

  const Container = twc.div`flex flex-col gap-2 px-4 h-full max-w-3xl mx-auto w-full`;

  const CreatingView = () => <CraftingPlacholder />;
  const subject = new ReplaySubject<SuggestionPredictionPartialOutput>(1);
  const stream = await new RemixSuggestionsTokenStream({
    cacheKey: `recipe:${slug}`,
  }).getStream({
    recipe,
  });

  const RemixSuggestionsView = () => {
    return (
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
          <SubjectGenerator
            stream={stream}
            schema={SuggestionPredictionOutputSchema}
            subject={subject}
          />
          <Label className="text-xs text-muted-foreground uppercase font-semibold">
            Ideas
          </Label>
          {new Array(6).fill(0).map((_, index) => {
            const suggesion$ = subject.pipe(
              map((output) => output?.suggestions?.[index]),
              takeUntil(
                subject.pipe(
                  filter((output) => {
                    return !!output?.suggestions?.[index + 1];
                  })
                )
              )
            );

            const name$ = suggesion$.pipe(
              filter((item) => !!item?.name),
              map((item) => item?.name!)
            );
            const desc$ = suggesion$.pipe(
              filter((item) => !!item?.description),
              map((item) => item?.description!)
            );

            return (
              <ResultCard key={index} index={index}>
                <Suspense fallback={<Skeleton className="w-full h-8" />}>
                  <h3 className="font-semibold text-lg">
                    <LastValue observable={name$} />
                  </h3>
                </Suspense>
                <Suspense fallback={<Skeleton className="w-full h-8" />}>
                  <LastValue observable={desc$} />
                </Suspense>
              </ResultCard>
            );
          })}
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
  };

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
