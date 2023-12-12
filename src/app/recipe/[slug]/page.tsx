import { Header } from "@/app/header";
import { Card } from "@/components/display/card";
import { Skeleton, SkeletonSentence } from "@/components/display/skeleton";
import Image from "next/image";
import { Recipe as RecipeJSONLDSchema, WithContext } from "schema-dts";

import { FAQsTokenStream } from "@/app/api/recipe/[slug]/faqs/stream";
import Generator from "@/components/ai/generator";
import { Badge } from "@/components/display/badge";
import { Separator } from "@/components/display/separator";
import { Button } from "@/components/input/button";
import { CommandItem } from "@/components/input/command";
import { LastValue } from "@/components/util/last-value";
import { RecipeSchema, RecipesTable, db } from "@/db";
import {
  findLatestRecipeVersion,
  findSlugForRecipeVersion,
  getFirstMediaForRecipe,
  getRecipe,
  getSortedMediaForRecipe,
} from "@/db/queries";
import { NewRecipe, Recipe } from "@/db/types";
import { env } from "@/env.public";
import { getSession } from "@/lib/auth/session";
import { getResult } from "@/lib/db";
import { noop } from "@/lib/utils";
import {
  FAQsPredictionInputSchema,
  QuestionsPredictionOutputSchema,
  SuggestionPredictionInputSchema,
  TempRecipeSchema,
} from "@/schema";
import { RecipePredictionInput, TempRecipe } from "@/types";
import { kv } from "@vercel/kv";
import { randomUUID } from "crypto";
import {
  BackpackIcon,
  CameraIcon,
  ChefHatIcon,
  EditIcon,
  HelpCircle,
  LibraryIcon,
  ScrollIcon,
  ShoppingBasketIcon,
  ShuffleIcon,
  UtensilsCrossedIcon,
} from "lucide-react";
import { Metadata } from "next";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ComponentProps, ReactNode, Suspense } from "react";
import {
  BehaviorSubject,
  Observable,
  defaultIfEmpty,
  last,
  lastValueFrom,
  map,
  of,
  shareReplay,
  takeWhile,
} from "rxjs";
import { z } from "zod";
import { ShareButton } from "../components.client";
import { UpvoteButton } from "../upvote-button/component";
import {
  CraftingDetails,
  Ingredients,
  Instructions,
  Tags,
  Times,
} from "./components";
import { getObservables } from "./observables";
import { ProductsCarousel } from "./products/components";
import RecipeGenerator from "./recipe-generator";
import {
  SousChefCommand,
  SousChefCommandInput,
  SousChefCommandItem,
  SousChefFAQSuggestionsCommandGroup,
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

  const [session, recipe, mediaList, latestVersion] = await Promise.all([
    getSession(),
    getRecipe(slug),
    getSortedMediaForRecipe(slug),
    findLatestRecipeVersion(slug),
  ]);

  const userId = session?.user.id;

  let loading = false;
  let isError = false;
  let input: RecipePredictionInput | undefined;
  let name: string;
  let description: string;
  let recipeUserId: string | undefined;
  let tempRecipe: TempRecipe | undefined;

  if (!recipe) {
    const recipeKey = `recipe:${slug}`;
    const data = await kv.hgetall(recipeKey);
    tempRecipe = TempRecipeSchema.parse(data);
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
    if (latestVersion && recipe.versionId !== latestVersion.versionId) {
      const slug = await findSlugForRecipeVersion(
        db,
        recipe.id,
        latestVersion.versionId
      );
      return redirect(`/recipe/${slug}`);
    }
    ({ name, description } = recipe);
    recipeUserId = recipe.createdBy;
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

  const generatorSubject = new BehaviorSubject<Partial<Recipe>>(
    recipe ? recipe : {}
  );

  const recipe$: Observable<Partial<Recipe>> = recipe
    ? of(recipe)
    : tempRecipe?.runStatus === "done"
    ? of({
        ...tempRecipe,
        createdAt: new Date(tempRecipe.createdAt),
      })
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

  const finalRecipeSchema = RecipeSchema.pick({
    name: true,
    description: true,
    tags: true,
    ingredients: true,
    instructions: true,
  });
  let finalRecipe$: Observable<z.infer<typeof finalRecipeSchema>>;
  if (recipe) {
    finalRecipe$ = of(recipe).pipe(shareReplay(1));
  } else if (tempRecipe && tempRecipe.runStatus === "done") {
    finalRecipe$ = of(finalRecipeSchema.parse(tempRecipe)).pipe(shareReplay(1));
  } else {
    finalRecipe$ = recipe$.pipe(
      last(),
      map((recipe) => finalRecipeSchema.parse(recipe)),
      shareReplay(1)
    );
  }

  const WaitForRecipe = async ({ children }: { children: ReactNode }) => {
    await lastValueFrom(finalRecipe$);
    return <>{children}</>;
  };

  const AssistantContent = () => {
    const faq$ = new BehaviorSubject<string[]>([]);

    const FAQGenerator = async () => {
      const existingQuestionsResult =
        QuestionsPredictionOutputSchema.shape.questions.safeParse(
          await kv.get(`recipe:${slug}:questions`)
        );
      if (existingQuestionsResult.success) {
        faq$.next(existingQuestionsResult.data);
        faq$.complete();
        return null;
      } else {
        console.error(existingQuestionsResult.error);
      }

      const recipeTokenStream = new FAQsTokenStream();
      const recipe =
        tempRecipe?.runStatus === "done" ? tempRecipe : generatorSubject.value;

      const input = FAQsPredictionInputSchema.parse({
        recipe,
      });
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
            kv.set(`recipe:${slug}:questions`, questions);
            faq$.complete();
          }}
        />
      );
    };

    const NUM_FAQ_SUGGESTIONS = 6;
    const items = new Array(NUM_FAQ_SUGGESTIONS).fill(0);

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
          <SousChefFAQSuggestionsCommandGroup
            defaultValue={undefined}
            heading="FAQ"
          >
            <Suspense
              fallback={
                <>
                  {items.map((_, index) => {
                    return (
                      <SousChefCommandItem
                        disabled={true}
                        key={index}
                        className="flex flex-row gap-2"
                      >
                        <Button size="icon" variant="secondary">
                          <HelpCircle className="opacity-40" />
                        </Button>
                        <div className="flex-1">
                          <SkeletonSentence
                            className="h-4"
                            numWords={[5, 7, 10]}
                            widths={[12, 16, 20]}
                          />
                        </div>
                        <Badge className="opacity-50" variant="secondary">
                          Ask
                        </Badge>
                      </SousChefCommandItem>
                    );
                  })}
                </>
              }
            >
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
          </SousChefFAQSuggestionsCommandGroup>
        </SousChefCommand>
      </>
    );
  };

  const CurrentRecipeGenerator = () => {
    return (
      <>
        {input && generatorSubject && (
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
                if (output.recipe) {
                  generatorSubject.next(output.recipe);
                }
              }}
              onError={(error, outputRaw) => {
                kv.hset(`recipe:${slug}`, {
                  runStatus: "error",
                  error,
                  outputRaw,
                }).then(noop);
              }}
              onComplete={(output) => {
                const createdAt = new Date();
                if (userId) {
                  const finalRecipe = {
                    id: randomUUID(),
                    slug,
                    versionId: 0,
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
                    createdAt,
                  } satisfies NewRecipe;

                  db.insert(RecipesTable)
                    .values(finalRecipe)
                    .then(() => {
                      revalidatePath("/");
                    });
                }
                kv.hset(`recipe:${slug}`, {
                  runStatus: "done",
                  name,
                  description,
                  yield: output.recipe.yield,
                  tags: output.recipe.tags,
                  ingredients: output.recipe.ingredients,
                  instructions: output.recipe.instructions,
                  cookTime: output.recipe.cookTime,
                  activeTime: output.recipe.activeTime,
                  totalTime: output.recipe.totalTime,
                  createdAt: new Date(),
                }).then(noop);

                generatorSubject.next({
                  ...output.recipe,
                  name,
                  description,
                  createdAt: new Date(),
                });
                generatorSubject.complete();
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
    const mainMedia = mediaList[0];

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

      <div className="flex flex-col gap-2 max-w-3xl mx-auto">
        <CurrentRecipeGenerator />
        {mediaList.length ? (
          <div
            className="w-full relative rounded-b-xl"
            style={{ height: `calc(50vh + 6rem)` }}
          >
            <Header className="absolute left-0 right-0 top-0 z-20" />
            <div className="absolute top-24 w-screen left-1/2 transform -translate-x-1/2 flex z-10 justify-center">
              <div className="carousel space-x-2 absolute pr-8">
                <div className="w-2 h-full carousel-item" />
                {mediaList.map((media, index) => {
                  return (
                    <div
                      className="carousel-item h-[50vh]"
                      id={`media-${index}`}
                      key={media.id}
                    >
                      <Image
                        className="h-[50vh] w-auto rounded-box"
                        src={media.url}
                        priority={index == 0}
                        width={media.width}
                        height={media.height}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        alt={`${name} - Image ${index + 1}`}
                      />
                      {/* {index >= 1 && (
                        <Link
                          href={`#media-${index - 1}`}
                          shallow
                          className="absolute left-4 top-[50%] z-50 hidden sm:block"
                        >
                          <Button size="icon" variant="outline">
                            <ArrowLeftCircleIcon />
                            <span className="sr-only">Next Photo</span>
                          </Button>
                        </Link>
                      )} */}

                      {/* {index < mediaList.length - 1 && (
                        <Link
                          href={`#media-${index + 1}`}
                          shallow
                          className="absolute right-4 top-[50%] z-50 hidden sm:block"
                        >
                          <Button size="icon" variant="outline">
                            <ArrowRightCircleIcon />
                            <span className="sr-only">Next Photo</span>
                          </Button>
                        </Link>
                      )} */}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <Header />
        )}
        <div className="flex flex-col gap-2 max-w-xl mx-auto">
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
                <UpvoteButton userId={userId} slug={slug} />
                {/* {userId && (
                  <AsyncRenderFirstValue
                    render={([hasVoted, points]) => (
                      <UpvoteButtonClient count={points} alreadyVoted={hasVoted} />
                    )}
                    fallback={<UpvoteButtonLoading />}
                    observable={combineLatest([
                      from(hasUserVotedOnRecipe(db, userId, slug)),
                      from(getRecipePoints(db, slug)),
                    ])}
                  />
                )} */}
                <UploadMediaButton slug={slug}>
                  <CameraIcon />
                </UploadMediaButton>
                <Button
                  event={{ type: "REMIX", slug }}
                  variant="outline"
                  aria-label="Remix"
                >
                  <ShuffleIcon />
                </Button>
                <Link href={`/recipe/${slug}/edit`}>
                  <Button
                    variant="outline"
                    aria-label="Remix"
                    className="w-full"
                  >
                    <EditIcon />
                  </Button>
                </Link>
                <ShareButton
                  slug={slug}
                  name={name}
                  description={description}
                />
              </div>
            </div>
            <Separator />
            {recipeUserId && recipe?.createdAt && (
              <>
                <div className="flex flex-row gap-2 p-2 justify-center hidden-print">
                  <div className="flex flex-col gap-2 items-center">
                    <Suspense fallback={<Skeleton className="w-full h-20" />}>
                      <CraftingDetails
                        createdAt={recipe.createdAt.toISOString()}
                        createdBy={recipeUserId}
                      />
                    </Suspense>
                  </div>
                </div>
                <Separator className="hidden-print" />
              </>
            )}
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
          <Card id="assistant" className="mx-3">
            <AssistantContent />
          </Card>
          <Card id="products" className="mx-3 mb-3">
            <div className="flex flex-row justify-between p-4">
              <h3 className="uppercase text-xs font-bold text-accent-foreground">
                Consumables
              </h3>
              <BackpackIcon />
            </div>
            <p className="text-muted-foreground text-xs px-4">
              Pantry items, ingredients, and other things you may need.
            </p>
            <div className="relative h-96">
              <div className="absolute w-screen left-1/2 top-6 transform -translate-x-1/2 h-70 flex justify-center z-20">
                <ProductsCarousel
                  slug={slug}
                  input$={finalRecipe$.pipe(
                    map((recipe) => ({ recipe, type: "ingredient" }))
                  )}
                />
              </div>
            </div>
          </Card>
          <Card id="products" className="mx-3 mb-3">
            <div className="flex flex-row justify-between p-4">
              <h3 className="uppercase text-xs font-bold text-accent-foreground">
                Gear
              </h3>
              <UtensilsCrossedIcon />
            </div>
            <p className="text-muted-foreground text-xs px-4">
              To help you along the way.
            </p>
            <div className="relative h-96">
              <div className="absolute w-screen left-1/2 top-6 transform -translate-x-1/2 h-70 flex justify-center z-20">
                <ProductsCarousel
                  slug={slug}
                  input$={finalRecipe$.pipe(
                    map((recipe) => ({ recipe, type: "equipment" }))
                  )}
                />
              </div>
            </div>
          </Card>
          <Card id="products" className="mx-3 mb-3">
            <div className="flex flex-row justify-between p-4">
              <h3 className="uppercase text-xs font-bold text-accent-foreground">
                Books
              </h3>
              <LibraryIcon />
            </div>
            <p className="text-muted-foreground text-xs px-4">
              Dive deeper from authors related to this recipe.
            </p>
            <div className="relative h-96">
              <div className="absolute w-screen left-1/2 top-6 transform -translate-x-1/2 h-70 flex justify-center z-20">
                <ProductsCarousel
                  slug={slug}
                  input$={finalRecipe$.pipe(
                    map((recipe) => ({ recipe, type: "book" }))
                  )}
                />
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
  const creatorSlug = `@${recipe?.createdBySlug}` || "Anonymous";
  const title = `${name} by ${creatorSlug} | KitchenCraft.ai`;

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
      description: `${recipe?.description} Crafted by ${creatorSlug} on ${dateStr}`,
      images,
    },
  };
}
