import { Header } from "@/app/header";
import { Card } from "@/components/display/card";
import { Skeleton } from "@/components/display/skeleton";
import Image from "next/image";
import { Recipe as RecipeJSONLDSchema, WithContext } from "schema-dts";

import {
  getFirstMediaForRecipe,
  getRecipe,
  getSortedMediaForRecipe,
} from "@/app/(home)/queries";
import { FAQsTokenStream } from "@/app/api/recipe/[slug]/faqs/stream";
import Generator from "@/components/ai/generator";
import { Badge } from "@/components/display/badge";
import { Separator } from "@/components/display/separator";
import { EventButton } from "@/components/event-button";
import { Button } from "@/components/input/button";
import { CommandGroup, CommandItem } from "@/components/input/command";
import { LastValue } from "@/components/util/last-value";
import { RecipeSchema, RecipesTable, db } from "@/db";
import { NewRecipe, Recipe } from "@/db/types";
import { env } from "@/env.public";
import { getSession } from "@/lib/auth/session";
import { getResult } from "@/lib/db";
import { noop } from "@/lib/utils";
import {
  QuestionsPredictionOutputSchema,
  SuggestionPredictionInputSchema,
  TempRecipeSchema,
} from "@/schema";
import { RecipePredictionInput } from "@/types";
import { kv } from "@vercel/kv";
import {
  ArrowLeftRightIcon,
  CameraIcon,
  ChefHatIcon,
  HelpCircle,
  MicrowaveIcon,
  NutOffIcon,
  ScaleIcon,
  ScrollIcon,
  ShoppingBasketIcon,
  ShuffleIcon,
} from "lucide-react";
import { Metadata } from "next";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import React, { ComponentProps, ReactNode, Suspense } from "react";
import {
  BehaviorSubject,
  Observable,
  defaultIfEmpty,
  lastValueFrom,
  map,
  of,
  takeWhile,
} from "rxjs";
import {
  CraftingDetails,
  Ingredients,
  Instructions,
  Tags,
  Times,
} from "./components";
import {
  RemixCommand,
  RemixCommandGroup,
  RemixCommandInput,
} from "./components.client";
import { getObservables } from "./observables";
import RecipeGenerator from "./recipe-generator";
import {
  SousChefCommand,
  SousChefCommandInput,
  SousChefCommandItem,
  SousChefOutput,
  SousChefPromptCommandGroup,
} from "./sous-chef-command/components";
import { UploadMediaButton } from "./upload-media-button";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Props = {
  params: { slug: string };
};

export default async function Page(props: Props) {
  const { slug } = props.params;

  const [session, recipe, media] = await Promise.all([
    getSession(),
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

        input = {
          type: "NEW_RECIPE_FROM_SUGGESTIONS",
          recipe: {
            name,
            description,
          },
          suggestionsInput,
        } satisfies RecipePredictionInput;
      } else if (fromPrompt) {
        input = {
          type: "NEW_INSTANT_RECIPE",
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

  const WaitForRecipe = async ({ children }: { children: ReactNode }) => {
    await lastValueFrom(recipe$);
    return <>{children}</>;
  };

  const AssistantContent = () => {
    const faq$ = new BehaviorSubject<string[]>([]);

    const FAQGenerator = async () => {
      const recipeTokenStream = new FAQsTokenStream();
      const input = {
        recipe: RecipeSchema.parse(generatorSubject.value),
      };
      const stream = await recipeTokenStream.getStream(input);

      return (
        <Generator
          stream={stream}
          schema={QuestionsPredictionOutputSchema}
          onStart={() => {}}
          onProgress={({ questions }) => {
            if (questions) {
              faq$.next(questions);
            }
          }}
          onComplete={({ questions }) => {
            faq$.next(questions);
            faq$.complete();
          }}
        />
      );
    };

    const items = new Array(6).fill(0);

    const SousChefFAQSuggestionCommandItem = async ({
      index,
    }: ComponentProps<typeof CommandItem> & { index: number }) => {
      const text = await lastValueFrom(
        faq$.pipe(
          map((items) => {
            const item = items[index];
            const nextItemExists = !!items?.[index + 1];
            return { item, nextItemExists };
          }),
          takeWhile(({ nextItemExists }) => !nextItemExists, true),
          map(({ item }) => item),
          defaultIfEmpty(undefined)
        )
      );

      return (
        <SousChefCommandItem
          key={index}
          value={text}
          className="flex flex-row gap-2"
        >
          <Suspense fallback={<Skeleton className="w-full h-6" />}>
            <Button size="icon" variant="secondary">
              <HelpCircle className="opacity-40" />
            </Button>
            <h4 className="text-sm flex-1">{text}</h4>
          </Suspense>
          <Badge variant="secondary">Ask</Badge>
        </SousChefCommandItem>
      );
    };

    return (
      <>
        <Suspense fallback={null}>
          <WaitForRecipe>
            <FAQGenerator />
          </WaitForRecipe>
        </Suspense>
        <div className="px-5">
          <div className="flex flex-row justify-between gap-1 items-center py-4">
            <h3 className="uppercase text-xs font-bold text-accent-foreground">
              Sous Chef
            </h3>
            <ChefHatIcon />
          </div>
        </div>
        <SousChefCommand slug={slug}>
          <SousChefCommandInput />
          <Separator />
          <Suspense fallback={null}>
            <WaitForRecipe>
              <SousChefPromptCommandGroup />
            </WaitForRecipe>
          </Suspense>
          <SousChefOutput />
          <CommandGroup defaultValue={undefined} heading="FAQ">
            <Suspense fallback={<Skeleton className={"w-full h-20 my-4"} />}>
              <WaitForRecipe>
                {items.map((_, index) => {
                  return (
                    <SousChefFAQSuggestionCommandItem
                      key={index}
                      index={index}
                      className="flex flex-row gap-2"
                    />
                  );
                })}
              </WaitForRecipe>
            </Suspense>
          </CommandGroup>
        </SousChefCommand>
      </>
    );
  };

  const RemixContent = () => {
    return (
      <>
        <div className="px-5">
          <div className="flex flex-row justify-between gap-1 items-center py-4">
            <h3 className="uppercase text-xs font-bold text-accent-foreground">
              Remix
            </h3>
            <ShuffleIcon />
          </div>
        </div>
        <RemixCommand slug={slug}>
          <RemixCommandInput />
          <RemixCommandGroup />
        </RemixCommand>
        <Separator className="mb-4" />
        <div className="mb-4 flex flex-col gap-2">
          <Suspense fallback={<Skeleton className="w-full h-20" />}>
            <div className="grid grid-cols-2 px-3 gap-2">
              <DisableUntilLoaded>
                <EventButton
                  variant="outline"
                  className="w-full h-auto flex flex-col gap-1 items-center"
                  event={{
                    type: "MODIFY_RECIPE_INGREDIENTS",
                  }}
                >
                  <ArrowLeftRightIcon />
                  <h5>Substitute</h5>
                  <p className="text-xs font-medium text-muted-foreground">
                    Add or replace ingredients.
                  </p>
                </EventButton>
              </DisableUntilLoaded>
              <DisableUntilLoaded>
                <EventButton
                  variant="outline"
                  className="w-full h-auto flex flex-col gap-1 items-center"
                  event={{
                    type: "MODIFY_RECIPE_DIETARY",
                  }}
                >
                  <NutOffIcon />
                  <h5>Dietary</h5>
                  <p className="text-xs font-medium text-muted-foreground">
                    Modify recipe for specific diets.
                  </p>
                </EventButton>
              </DisableUntilLoaded>
              <DisableUntilLoaded>
                <EventButton
                  variant="outline"
                  className="w-full h-auto flex flex-col gap-1 items-center"
                  event={{
                    type: "MODIFY_RECIPE_SCALE",
                  }}
                >
                  <ScaleIcon />
                  <h5>Scale</h5>
                  <p className="text-xs font-medium text-muted-foreground">
                    Adjust recipe for more/fewer servings.
                  </p>
                </EventButton>
              </DisableUntilLoaded>
              <DisableUntilLoaded>
                <EventButton
                  variant="outline"
                  className="w-full h-auto flex flex-col gap-1 items-center"
                  event={{ type: "MODIFY_RECIPE_EQUIPMENT" }}
                >
                  <MicrowaveIcon />
                  <h5>Equipment</h5>
                  <p className="text-xs font-medium text-muted-foreground">
                    Adapt recipe for different tools.
                  </p>
                </EventButton>
              </DisableUntilLoaded>
            </div>
          </Suspense>
        </div>
      </>
    );
  };

  const DisableUntilLoaded = async ({ children }: { children: ReactNode }) => {
    const Content = ({
      disabled,
      children,
    }: {
      disabled: boolean;
      children: ReactNode;
    }) => {
      return React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            disabled,
          });
        }
        return child;
      });
    };

    return (
      <Suspense fallback={<Content disabled={true}>{children}</Content>}>
        <WaitForRecipe>
          <Content disabled={false}>{children}</Content>
        </WaitForRecipe>
      </Suspense>
    );
  };

  const CurrentRecipeGenerator = () => {
    return (
      <>
        {userId && input && generatorSubject && (
          <Suspense fallback={<></>}>
            <RecipeGenerator
              input={input}
              onStart={() => {
                kv.hset(`recipe:${slug}`, {
                  runStatus: "started",
                  input,
                }).then(noop);
              }}
              onProgress={(output) => {
                // console.log("progress", output);
                if (output.recipe) {
                  generatorSubject.next(output.recipe);
                }
              }}
              onError={(error, outputRaw) => {
                console.log("error", error);
                kv.hset(`recipe:${slug}`, {
                  runStatus: "error",
                  error,
                  outputRaw,
                }).then(noop);
              }}
              onComplete={(output) => {
                const recipe = {
                  slug,
                  description,
                  name,
                  yield: output.recipe.yield,
                  tags: output.recipe.tags,
                  ingredients: output.recipe.ingredients,
                  instructions: output.recipe.instructions,
                  cookTime: output.recipe.cookTime,
                  activeTime: output.recipe.activeTime,
                  totalTime: output.recipe.totalTime,
                  createdBy: userId,
                  createdAt: new Date(),
                } satisfies NewRecipe;
                generatorSubject.next(recipe);

                db.insert(RecipesTable)
                  .values(recipe)
                  .then(() => {
                    console.log("saved to db!");
                  });

                kv.hset(`recipe:${slug}`, {
                  runStatus: "done",
                  ...output.recipe,
                }).then(() => {
                  generatorSubject.complete();
                });

                kv.zadd(`recipes:new`, {
                  score: Date.now(),
                  member: slug,
                }).then(() => {
                  revalidatePath("/");
                });
              }}
            />
          </Suspense>
        )}
      </>
    );
  };

  const Schema = () => {
    if (!recipe) {
      return null;
    }
    const mainMedia = media[0];

    const image = mainMedia
      ? {
          image: mainMedia.url,
        }
      : {};

    const jsonLd: WithContext<RecipeJSONLDSchema> = {
      "@context": "https://schema.org",
      "@type": "Recipe",
      name: recipe.name,
      description: recipe.description,
      recipeYield: recipe.yield,
      recipeIngredient: recipe.ingredients,
      recipeInstructions: recipe.instructions,
      totalTime: recipe.totalTime,
      prepTime: recipe.activeTime,
      cookTime: recipe.cookTime,
      image: `/recipe/${slug}/media/${0}`,
    };

    return (
      <section>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </section>
    );
  };

  return (
    <>
      <Schema />

      <div className="flex flex-col gap-2 max-w-2xl mx-auto">
        <CurrentRecipeGenerator />
        <div>
          {media.length ? (
            <div className="w-full aspect-square overflow-hidden relative rounded-b-xl shadow-md">
              <Header className="absolute left-0 right-0 top-0 z-10" />
              <div className="carousel carousel-center w-full aspect-square">
                {media.map((media, index) => {
                  return (
                    <Image
                      key={media.id}
                      className="carousel-item"
                      src={media.url}
                      priority={index == 0}
                      width={media.width}
                      height={media.height}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      alt={`${name} - Image ${index + 1}`}
                      style={{ objectFit: "cover" }}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <Header />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Card className="flex flex-col gap-2 pb-5 mx-3">
            <div className="flex flex-row gap-3 p-5 justify-between">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold">{name}</h1>
                <p className="text-lg text-muted-foreground">{description}</p>
                <div className="text-sm text-muted-foreground flex flex-row gap-2 items-center">
                  <span>Yields</span>
                  <span>
                    <Suspense fallback={<Skeleton className="w-24 h-5" />}>
                      <LastValue observable={yield$} />
                    </Suspense>
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1 hidden-print">
                <UploadMediaButton slug={slug}>
                  <CameraIcon />
                </UploadMediaButton>
                {/* <AddButton>
                <PlusSquareIcon />
              </AddButton>
              <UploadMediaButton slug={store.get().recipe.slug}>
                <CameraIcon />
              </UploadMediaButton> */}
                {/* <PrintButton>
                <PrinterIcon />
              </PrintButton> */}
                {/* <ShareButton>
                <ShareIcon />
              </ShareButton> */}
                {/* <UpvoteButton>
                <ArrowBigUpDashIcon />
                <span className="font-bold">1</span>
              </UpvoteButton> */}
                <Button variant="outline" aria-label="Remix">
                  <Link href={`#remix`}>
                    <ShuffleIcon />
                  </Link>
                </Button>
              </div>
            </div>
            <Separator />
            <div className="flex flex-row gap-2 p-2 justify-center hidden-print">
              <div className="flex flex-col gap-2 items-center">
                <Suspense fallback={<Skeleton className="w-full h-20" />}>
                  <CraftingDetails createdAt={new Date().toDateString()} />
                </Suspense>
              </div>
            </div>
            <Separator className="hidden-print" />
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
          <Card id="remix" className="mx-3 mb-3">
            <RemixContent />
          </Card>
          <Card id="assistant" className="mx-3 mb-3">
            <AssistantContent />
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
