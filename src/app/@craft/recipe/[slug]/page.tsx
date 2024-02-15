import { getRecipeStream$ } from "@/app/recipe/[slug]/observables";
import { getBaseRecipe } from "@/app/recipe/[slug]/queries";
import SubjectGenerator from "@/components/ai/subject-generator";
import { Card } from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Skeleton } from "@/components/display/skeleton";
import { LastValue } from "@/components/util/last-value";
import { getRecipe } from "@/db/queries";
import { SuggestionPredictionOutputSchema } from "@/schema";
import { SuggestionPredictionPartialOutput } from "@/types";
import { Suspense } from "react";
import { twc } from "react-twc";
import {
  ReplaySubject,
  filter,
  lastValueFrom,
  map,
  take,
  takeUntil,
} from "rxjs";
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
import { ChevronRightIcon, ShuffleIcon } from "lucide-react";
import { Badge } from "@/components/display/badge";

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
  const { name, description } = await getBaseRecipe(slug);
  // const recipeData$ = await getBase$(slug);

  const Container = twc.div`flex flex-col gap-2 px-4 h-full max-w-3xl mx-auto w-full`;

  const CreatingView = () => <CraftingPlacholder />;
  const subject = new ReplaySubject<SuggestionPredictionPartialOutput>(1);

  // const Generator = async () => {
  //   const tokenStream = await new RemixSuggestionsTokenStream({
  //     cacheKey: `remix-suggestions:${slug}`,
  //   });

  //   let stream: Awaited<ReturnType<typeof tokenStream.getStream>>;
  //   if (!recipe) {
  //     const recipeStream = await getRecipeStream$(slug);
  //     const recipe = await lastValueFrom(recipeStream);
  //     stream = await tokenStream.getStream({ recipe });
  //   } else {
  //     stream = await tokenStream.getStream({ recipe });
  //   }

  //   return (
  //     <SubjectGenerator
  //       stream={stream}
  //       schema={SuggestionPredictionOutputSchema}
  //       subject={subject}
  //     />
  //   );
  // };

  const RemixSuggestionsView = () => {
    return (
      <>
        <Container>
          <Card className="border-dashed flex-flex-col gap-2 p-3">
            <Label className="text-xs text-muted-foreground uppercase font-semibold">
              Remixing
            </Label>
            <div className="sm:basis-60 sm:flex-shrink-0 font-semibold">
              {name}
            </div>
          </Card>
          {/* <Suspense fallback={null}>
            <Generator />
          </Suspense> */}
          <Label className="text-xs text-muted-foreground uppercase font-semibold">
            Ideas
          </Label>
          {/* {new Array(6).fill(0).map((_, index) => {
            const suggesion$ = subject.pipe(
              map((output) => output?.suggestions?.[index]),
              takeUntil(
                subject.pipe(
                  filter((output) => {
                    return !!output?.suggestions?.[index + 1];
                  }),
                  take(1)
                )
              )
            );

            const name$ = suggesion$.pipe(
              filter((item) => !!item?.name),
              map((item) => item?.name!),
              take(1)
            );
            const desc$ = suggesion$.pipe(
              filter((item) => !!item?.description),
              map((item) => item?.description!),
              take(1)
            );

            return (
              <ResultCard key={index} index={index}>
                <div className="flex flex-col gap-2 p-3 w-full sm:flex-row">
                  <div className="sm:basis-60 sm:flex-shrink-0 font-semibold">
                    <Suspense
                      fallback={<Skeleton className="w-2/3 sm:w-full h-7" />}
                    >
                      <LastValue observable={name$} />
                    </Suspense>
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
                    <p>
                      <LastValue observable={desc$} />
                    </p>
                  </Suspense>
                </div>
                <div className="w-24 flex flex-row justify-center">
                  <Badge className="flex flex-col gap-1 rounded-md px-2 py-1">
                    <ShuffleIcon />
                    Remix
                  </Badge>
                </div>
              </ResultCard>
            );
          })} */}
        </Container>
      </>
    );
  };

  const RemixPreviewResultView = () => <>Preview Result</>;

  return (
    <>
      <CraftInputting>
        <></>
        {/* <NewRecipeResultsView /> */}
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
