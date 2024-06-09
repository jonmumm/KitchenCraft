import { Card } from "@/components/display/card";
import { Skeleton } from "@/components/display/skeleton";

import { Separator } from "@/components/display/separator";
import { Input } from "@/components/input";
import { Button } from "@/components/input/button";
import { Textarea } from "@/components/input/textarea";
import StickyHeader from "@/components/layout/sticky-header";
import {
  getFirstMediaForRecipe,
  getRecipe,
  getSortedMediaForRecipe,
} from "@/db/queries";
import { Recipe } from "@/db/types";
import { env } from "@/env.public";
import { getNextAuthSession } from "@/lib/auth/session";
import { getResult } from "@/lib/db";
import { SuggestionPredictionInputSchema, TempRecipeSchema } from "@/schema";
import { RecipePredictionInput } from "@/types";
import { kv } from "@/lib/kv";
import { ArrowLeftIcon, ScrollIcon, ShoppingBasketIcon } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { BehaviorSubject, Observable, firstValueFrom, of } from "rxjs";
import { Ingredients, Instructions, Tags, Times } from "../components";
import { getObservables } from "../observables";
import { EditName } from "./components.client";
import { assert } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Props = {
  params: { slug: string };
};

export default async function Page(props: Props) {
  const { slug } = props.params;

  const [session, recipe, media] = await Promise.all([
    getNextAuthSession(),
    getRecipe(slug),
    getSortedMediaForRecipe(slug),
  ]);

  const userId = session?.user.id;

  let loading = false;
  let isError = false;
  let input: RecipePredictionInput | undefined;
  let name: string;
  let description: string;

  if (!recipe) {
    // Recipe doesn't exist, check redis to see if there is one pending for this slug...
    const recipeKey = `recipe:${slug}`;
    const data = await kv.hgetall(recipeKey);
    const tempRecipe = TempRecipeSchema.parse(data);
    const { runStatus, fromResult, fromPrompt } = tempRecipe;
    ({ name, description } = tempRecipe);

    const isDone = runStatus === "done";
    isError = runStatus === "error";
    loading = !isDone && !isError;

    if (loading) {
      if (fromResult) {
        const result = await getResult(kv, fromResult.resultId);
        const suggestionsInput = SuggestionPredictionInputSchema.parse(
          result.input
        );
        assert(suggestionsInput.prompt, "expected prompt");

        input = {
          recipe: {
            name,
            description,
          },
          prompt: suggestionsInput.prompt,
        } satisfies RecipePredictionInput;
      } else if (fromPrompt) {
        input = {
          recipe: {
            name,
            description,
          },
          prompt: fromPrompt,
        } satisfies RecipePredictionInput;
      } else {
        console.error("recipe exists but input not found");
        return notFound();
      }
    }
  } else {
    ({ name, description } = recipe);
  }

  if (isError) {
    const outputRaw = (await kv.hget(`recipe:${slug}`, "outputRaw")) as string;
    const outputSanitized = (await kv.hget(
      `recipe:${slug}`,
      "outputSanitized"
    )) as string;
    return (
      <Card className="p-3 m-4">
        <h3>Error with recipe</h3>
        {/* <p>{error}</p> */}

        <h4>Sanitized Output</h4>
        <Card className="p-5">
          <pre dangerouslySetInnerHTML={{ __html: outputSanitized }} />
        </Card>

        <h4>Raw Output</h4>
        <Card className="p-5">
          <pre dangerouslySetInnerHTML={{ __html: outputRaw }} />
        </Card>
      </Card>
    );
  }

  if (!recipe && !userId) {
    console.error("must be logged in to create a recipe"); // hacky
    return redirect(`/login?next=${encodeURIComponent(`/recipe/${slug}`)}`);
  }

  const generatorSubject = new BehaviorSubject<Partial<Recipe>>(
    recipe ? recipe : {}
  );

  const recipe$: Observable<Partial<Recipe>> = recipe
    ? of(recipe)
    : generatorSubject;

  const {
    ingredients$,
    instructions$,
    tags$,
    yield$,
    activeTime$,
    cookTime$,
    totalTime$,
  } = getObservables(recipe$);

  const saveAsNewRecipe = async () => {
    "use server";
    // todo
    console.log("SAVE! new");
    // console.log(newRecipe);

    redirect("/");
  };
  const saveRecipe = async () => {
    "use server";

    // todo
    console.log("SAVE!");
  };

  return (
    <>
      <div className="flex flex-col gap-2 max-w-7xl mx-auto">
        <StickyHeader>
          <div className="flex flex-row gap-2 justify-between items-center">
            <Link href={`/recipe/${slug}`}>
              <Button size="icon" variant="outline">
                <ArrowLeftIcon />
              </Button>
            </Link>
            <div className="flex flex-row gap-2">
              <form action={saveRecipe}>
                <Button type="submit" size="lg">
                  Save (Over)
                </Button>
              </form>
              <form action={saveAsNewRecipe}>
                <Button type="submit" size="lg">
                  Save New
                </Button>
              </form>
            </div>
          </div>
        </StickyHeader>
        {/* )} */}
        <div className="flex flex-col gap-2 max-w-xl mx-auto">
          <Card className="flex flex-col gap-2 pb-5 mx-3">
            <div className="flex flex-row gap-3 p-5 justify-between">
              <div className="flex flex-col gap-2 w-full">
                <EditName defaultValue={name} />
                <Textarea
                  name="description"
                  className="text-muted-foreground text-lg"
                  value={description}
                  rows={4}
                />
                <div className="text-sm text-muted-foreground flex flex-row gap-2 items-center">
                  <span>Yields</span>
                  <span>
                    <Input
                      name="yield"
                      className="text-lg"
                      value={await firstValueFrom(yield$)}
                    />
                  </span>
                </div>
              </div>
            </div>
            <Separator />
            <Times
              totalTime$={totalTime$}
              activeTime$={activeTime$}
              cookTime$={cookTime$}
            />
            <Separator />
            <Tags tags$={tags$} />
            <Separator />

            <div className="px-5">
              <div className="flex flex-row justify-between gap-1 items-center py-4">
                <h3 className="uppercase text-xs font-bold text-accent-foreground">
                  Ingredients
                </h3>
                <ShoppingBasketIcon />
              </div>
              <div className="mb-4 flex flex-col gap-2">
                <Suspense fallback={<Skeleton className="w-full h-20" />}>
                  <ul className="list-disc pl-5 flex flex-col gap-2">
                    <Ingredients ingredients$={ingredients$} />
                  </ul>
                </Suspense>
              </div>
            </div>
            <Separator />

            <div className="px-5">
              <div className="flex flex-row justify-between gap-1 items-center py-4">
                <h3 className="uppercase text-xs font-bold text-accent-foreground">
                  Instructions
                </h3>
                <ScrollIcon />
              </div>
              <div className="mb-4 flex flex-col gap-2">
                <Suspense fallback={<Skeleton className="w-full h-20" />}>
                  <ol className="list-decimal pl-5 flex flex-col gap-2">
                    <Instructions instructions$={instructions$} />
                  </ol>
                </Suspense>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const recipe = await getRecipe(params.slug);
  let name, description;
  if (!recipe) {
    // Recipe doesn't exist, check redis to see if there is one pending for this slug...
    const recipeKey = `recipe:${params.slug}`;
    const data = await kv.hgetall(recipeKey);
    const tempRecipe = TempRecipeSchema.parse(data);
    ({ name, description } = tempRecipe);
  } else {
    ({ name, description } = recipe);
  }
  const title = `${name} by @InspectorT | KitchenCraft.ai`;

  const now = new Date(); // todo actually store this on the recipe
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(now);
  const dateStr = formattedDate.split(" at ").join(" @ ");

  const mainMedia = await getFirstMediaForRecipe(params.slug);

  const images = mainMedia
    ? [
        {
          url: env.KITCHENCRAFT_URL + `/recipe/${params.slug}/opengraph-image`,
          secure_url:
            env.KITCHENCRAFT_URL + `/recipe/${params.slug}/opengraph-image`,
          type: mainMedia.contentType,
          width: mainMedia.width,
          height: mainMedia.height,
        },
      ]
    : undefined;

  // todo add updatedTime
  return {
    title,
    metadataBase: new URL(env.KITCHENCRAFT_URL),
    openGraph: {
      title,
      description: `${recipe?.description} Crafted by @InspectorT on ${dateStr}`,
      images,
    },
  };
}
