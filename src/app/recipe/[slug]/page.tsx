import { Card } from "@/components/display/card";
import { Skeleton, SkeletonSentence } from "@/components/display/skeleton";
import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import { Recipe as RecipeJSONLDSchema, WithContext } from "schema-dts";

import { FAQsTokenStream } from "@/app/api/recipe/[slug]/faqs/stream";
import { TipsAndTricksTokenStream } from "@/app/api/recipe/[slug]/tips-and-tricks/stream";
import Generator from "@/components/ai/generator";
import { Badge } from "@/components/display/badge";
import MarkdownRenderer from "@/components/display/markdown";
import { Separator } from "@/components/display/separator";
import { Button } from "@/components/input/button";
import { CommandItem } from "@/components/input/command";
import { AsyncRenderFirstValue } from "@/components/util/async-render-first-value";
import { LastValue } from "@/components/util/last-value";
import { db } from "@/db";
import {
  findLatestRecipeVersion,
  findSlugForRecipeVersion,
  getFirstMediaForRecipe,
  getRecipe,
  getSortedMediaForRecipe,
} from "@/db/queries";
import { env } from "@/env.public";
import { getCurrentUserId } from "@/lib/auth/session";
import { kv } from "@/lib/kv";
import { delay } from "@/lib/utils";
import {
  FAQsPredictionInputSchema,
  QuestionsPredictionOutputSchema,
  RecipeBaseSchema,
} from "@/schema";
import { ObservableType } from "@/types";
import {
  AxeIcon,
  CameraIcon,
  GitForkIcon,
  HelpCircle,
  LightbulbIcon,
  MessagesSquareIcon,
  ScrollIcon,
  ShoppingBasketIcon,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ComponentProps, ReactNode, Suspense } from "react";
import {
  BehaviorSubject,
  defaultIfEmpty,
  lastValueFrom,
  map,
  takeWhile,
} from "rxjs";
import { ShareButton } from "../components.client";
import { UpvoteButton } from "../upvote-button/component";
import { Ingredients, Instructions, Tags, Times } from "./components";
import { TipsAndTricksContent } from "./components.client";
import { getAllVersionsOfRecipeBySlug } from "./history/queries";
import { getObservables, getRecipeStream$ } from "./observables";
import { getBaseRecipe, getRecipeOutputRaw } from "./queries";
import {
  SousChefCommand,
  SousChefCommandInput,
  SousChefCommandItem,
  SousChefFAQSuggestionsCommandGroup,
  SousChefOutput,
  SousChefPromptCommandGroup,
} from "./sous-chef-command/components";
import { UploadMediaButton } from "./upload-media-button";

export const maxDuration = 300;
export const dynamic = "force-dynamic";
export const revalidate = 10;

type Props = {
  params: { slug: string };
};

export default async function Page(props: Props) {
  const { slug } = props.params;
  const [
    baseRecipe,
    recipe,
    userId,
    mediaList,
    latestVersion,
    recipeData$,
    versions,
  ] = await Promise.all([
    getBaseRecipe(slug),
    getRecipe(slug),
    getCurrentUserId(),
    getSortedMediaForRecipe(slug),
    findLatestRecipeVersion(slug),
    getRecipeStream$(slug),
    getAllVersionsOfRecipeBySlug(db, slug),
  ]);

  const { runStatus } = baseRecipe;
  // const { runStatus } = tempRecipe;
  const isError = runStatus === "error";
  const { name, description } = baseRecipe;

  if (recipe && latestVersion && recipe.versionId !== latestVersion.versionId) {
    const slug = await findSlugForRecipeVersion(
      db,
      recipe.id,
      latestVersion.versionId
    );
    return redirect(`/recipe/${slug}`);
  }

  if (isError) {
    const outputRaw = await getRecipeOutputRaw(slug);
    return (
      <Card className="p-3 m-4">
        <h3>Error with recipe</h3>
        <h4>Raw Output</h4>
        <Card className="p-5">
          <pre dangerouslySetInnerHTML={{ __html: outputRaw }} />
        </Card>
      </Card>
    );
  }

  // const recipeData$ = new BehaviorSubject();

  const {
    ingredients$,
    instructions$,
    tags$,
    yield$,
    activeTime$,
    cookTime$,
    totalTime$,
  } = getObservables(recipeData$);

  // const generatedMedia$ = await getGeneratedMedia$(slug);

  //   const recipe = await firstValueFrom(recipe$);
  //   const replicate = new Replicate();

  const WaitForRecipe = async ({ children }: { children: ReactNode }) => {
    await lastValueFrom(recipeData$);
    return <>{children}</>;
  };

  // const GeneratedImages = () => {
  //   const items = new Array(6).fill(0);
  //   return (
  //     <>
  //       <div className="flex flex-row justify-between p-4">
  //         <h3 className="uppercase text-xs font-bold text-accent-foreground">
  //           Imagine
  //         </h3>
  //         <CameraIcon />
  //       </div>
  //       <p className="text-muted-foreground text-xs px-4">
  //         Generated photos to guide and inspire you
  //       </p>
  //       <div className="relative h-96">
  //         <div className="absolute w-screen left-1/2 top-6 transform -translate-x-1/2 h-70 flex justify-center z-20">
  //           <AsyncRenderFirstValue
  //             observable={generatedMedia$}
  //             render={(media) => {
  //               return <MediaCarousel media={media} />;
  //             }}
  //             fallback={<MediaCarouselFallback />}
  //           />
  //         </div>
  //       </div>
  //     </>
  //   );
  // };

  const AssistantContent = () => {
    const faq$ = new BehaviorSubject<string[]>([]);

    const FAQGenerator = async ({
      recipeData,
    }: {
      recipeData: ObservableType<typeof recipeData$>;
    }) => {
      const data = await kv.get(`recipe:${slug}:questions`);
      if (data) {
        const existingQuestionsResult =
          QuestionsPredictionOutputSchema.shape.questions.safeParse(data);
        if (existingQuestionsResult.success) {
          faq$.next(existingQuestionsResult.data);
          faq$.complete();
          return null;
        } else {
          console.error(existingQuestionsResult.error);
        }
      }
      const recipeTokenStream = new FAQsTokenStream();

      const input = FAQsPredictionInputSchema.parse({
        recipe: recipeData,
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
          <AsyncRenderFirstValue
            observable={recipeData$}
            render={(recipeData) => <FAQGenerator recipeData={recipeData} />}
            fallback={null}
          />
        </Suspense>
        <div className="px-5" id="assistant">
          <div className="flex flex-row justify-between gap-1 items-center py-4">
            <h3 className="uppercase text-xs font-bold text-accent-foreground">
              Assistant
            </h3>
            <MessagesSquareIcon />
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

  // const CurrentRecipeGenerator = () => {
  //   return (
  //     <>
  //       {input && generatorSubject && (
  //         <Suspense fallback={<></>}>
  //           <RecipeGenerator
  //             input={input}
  //             onStart={() => {
  //               kv.hset(`recipe:${slug}`, {
  //                 runStatus: "started",
  //                 input,
  //               }).then(noop);
  //             }}
  //             onProgress={(output) => {
  //               if (output.recipe) {
  //                 generatorSubject.next(output.recipe);
  //               }
  //             }}
  //             onError={(error, outputRaw) => {
  //               kv.hset(`recipe:${slug}`, {
  //                 runStatus: "error",
  //                 error,
  //                 outputRaw,
  //               }).then(noop);
  //             }}
  //             onComplete={(output) => {
  //               const createdAt = new Date();
  //               const createdBy = userId || guestId;
  //               assert(createdBy, `neither userId or guestId defined`);

  //               const finalRecipe = {
  //                 id: randomUUID(),
  //                 slug,
  //                 versionId: 0,
  //                 description,
  //                 name,
  //                 yield: output.recipe.yield,
  //                 tags: output.recipe.tags,
  //                 ingredients: output.recipe.ingredients,
  //                 instructions: output.recipe.instructions,
  //                 cookTime: output.recipe.cookTime,
  //                 activeTime: output.recipe.activeTime,
  //                 totalTime: output.recipe.totalTime,
  //                 prompt: input?.prompt!,
  //                 createdBy,
  //                 createdAt,
  //               } satisfies NewRecipe;

  //               db.insert(RecipesTable)
  //                 .values(finalRecipe)
  //                 .then(() => {
  //                   kv.hset(`recipe:${slug}`, {
  //                     runStatus: "done",
  //                   }).then(noop);
  //                   revalidatePath("/");
  //                   revalidatePath("/me");
  //                 });

  //               generatorSubject.next({
  //                 ...output.recipe,
  //                 slug,
  //                 name,
  //                 description,
  //                 createdAt,
  //               });
  //               generatorSubject.complete();
  //             }}
  //           />
  //         </Suspense>
  //       )}
  //     </>
  //   );
  // };

  const History = () => {
    const Versions = async () => {
      let allVersions = versions;
      if (!recipe) {
        // If we didnt have recipe initially, refetch all version
        await delay(500); // timing hack
        noStore();
        allVersions = await getAllVersionsOfRecipeBySlug(db, slug);
      }

      return allVersions.map((version, index) => {
        return (
          <>
            <li>
              {index !== 0 && <hr />}
              <div className="timeline-start flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">
                  Fri Dec 29 @ 10:32am
                </span>
                <div className="flex flex-row max-sm:justify-start justify-end">
                  <Badge variant="secondary">Version {index}</Badge>
                </div>
              </div>
              <div className="timeline-middle">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="timeline-end pt-8 pb-2">
                <div>
                  <h3 className="text-sm font-medium inline-block">
                    {version.name}
                  </h3>
                </div>
                <span className="text-muted-foreground text-sm italic">
                  &quot;{version.prompt}.&quot;
                </span>
                {/* <Badge
                          event={{
                            type: "NEW_RECIPE",
                            prompt: version.prompt,
                          }}
                          variant="secondary"
                          className="flex flex-row gap-1"
                        >
                          <span>Open Prompt</span>
                          <ShuffleIcon size={16} />
                        </Badge> */}
              </div>
              <hr />
            </li>
            <li>
              <hr />
              <div className="timeline-middle">
                <Button
                  variant="secondary"
                  event={{
                    type: "NEW_RECIPE",
                    prompt: latestVersion?.prompt,
                  }}
                  className="flex flex-row gap-1"
                >
                  <AxeIcon size={17} />
                  <span>Use Prompt</span>
                </Button>
              </div>
              <div className="timeline-end"></div>
            </li>
          </>
        );
      });
    };

    return (
      <>
        <div className="px-5">
          <div className="flex flex-row justify-between gap-1 items-center py-4">
            <h3 className="uppercase text-xs font-bold text-accent-foreground">
              History
            </h3>
            <GitForkIcon />
          </div>
        </div>
        <Separator />
        <div className="p-4">
          <ul className="timeline max-sm:timeline-compact timeline-vertical mb-6">
            <Suspense fallback={<Skeleton className="w-full h-20" />}>
              <WaitForRecipe>
                <Versions />
              </WaitForRecipe>
            </Suspense>
          </ul>
        </div>
      </>
    );
  };

  const TipsAndTricks = () => {
    //   const Content = () => {
    // const stream = await tokenStream.getStream(input);
    //     return <></>
    //   }
    // TODO, call getCachedStream(), if it exists, pass as initiaValue

    const Content = async () => {
      const tokenStream = new TipsAndTricksTokenStream({
        cacheKey: `tips-and-tricks:${slug}`,
      });
      const status = await tokenStream.getStatus();
      let initialValue;
      if (status === "done") {
        const stream = await tokenStream.getCompletedStream();

        const result = [];
        for await (const chunk of stream) {
          result.push(chunk);
        }
        initialValue = result.join("");
        return <MarkdownRenderer markdownText={initialValue} />;
      }

      return <TipsAndTricksContent slug={slug} />;
    };

    return (
      <>
        <div className="px-5">
          <div className="flex flex-row justify-between gap-1 items-center py-4">
            <h3 className="uppercase text-xs font-bold text-accent-foreground">
              Tips & Tricks
            </h3>
            <LightbulbIcon />
          </div>
        </div>
        <Separator />
        <div className="p-6">
          <Suspense fallback={<Skeleton className="w-full h-20" />}>
            <Content />
          </Suspense>
        </div>
      </>
    );
  };

  const Schema = async () => {
    const recipe = await getRecipe(slug);
    if (!recipe) {
      return null;
    }
    // const mainMedia = mediaList[0];

    // const image = mainMedia
    //   ? {
    //       image: mainMedia.url,
    //     }
    //   : {};

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
      <Suspense fallback={null}>
        <WaitForRecipe>
          <Schema />
        </WaitForRecipe>
      </Suspense>

      <div className="flex flex-col gap-2 max-w-7xl mx-auto">
        {mediaList.length ? (
          <div
            className="w-full relative rounded-b-xl"
            style={{ height: `50vh` }}
          >
            <div className="absolute top-0 w-screen left-1/2 transform -translate-x-1/2 flex z-10 justify-center">
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
        ) : null}
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
                {/* <Button
                  event={{ type: "REMIX", slug }}
                  variant="outline"
                  aria-label="Remix"
                >
                  <ShuffleIcon />
                </Button> */}
                {/* <Link href={`/recipe/${slug}/edit`}>
                  <Button
                    variant="outline"
                    aria-label="Remix"
                    className="w-full"
                  >
                    <EditIcon />
                  </Button>
                </Link> */}
                <Link href={"#history"}>
                  <Button
                    variant="outline"
                    aria-label="History"
                    className="w-full"
                  >
                    <GitForkIcon />
                  </Button>
                </Link>
                <ShareButton
                  slug={slug}
                  name={name}
                  description={description}
                />
              </div>
            </div>
            {/*
            <Separator />
            <div className="flex flex-col gap-2 justify-center items-center px-5" >
              <h2 className="font-semibold flex-1 truncate min-w-0">{name}</h2>
              <div className="flex flex-row gap-2 justify-center items-center flex-wrap">
                <Button variant="outline" className="flex flex-row gap-2">
                  Remix <ShuffleIcon size={16} />
                </Button>
                <Link href="#assistant">
                  <Button variant="outline" className="flex flex-row gap-2">
                    Assistant <MessagesSquareIcon size={16} />
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="outline">
                      <MoreVerticalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Upload Photo</DropdownMenuItem>
                    <DropdownMenuItem>Print</DropdownMenuItem>
                    <DropdownMenuItem>Share</DropdownMenuItem>
                    <DropdownMenuItem>
                      <GitForkIcon /> History
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div> */}
            <Separator />
            {/* {recipeUserId && recipe?.createdAt && (
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
            )} */}
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
          <Card id="history" className="mx-3">
            <History />
          </Card>
          <Card id="history" className="mx-3">
            <TipsAndTricks />
          </Card>
          {/* <Card id="assistant" className="mx-3">
            <AssistantContent />
          </Card> */}
          {/* {isImageGenEnabled && (
            <Card id="generated-images" className="mx-3">
              <GeneratedImages />
            </Card>
          )} */}
          {/* <Card id="products" className="mx-3 mb-3">
            <div className="flex flex-row justify-between p-4">
              <h3 className="uppercase text-xs font-bold text-accent-foreground">
                Consumables
              </h3>
              <BackpackIcon />
            </div>
            <p className="text-muted-foreground text-xs px-4">
              Things you may need.
            </p>
            <div className="relative h-96">
              <div className="absolute w-screen left-1/2 top-6 transform -translate-x-1/2 h-70 flex justify-center z-20">
                <ProductsCarousel
                  slug={slug}
                  input$={recipeData$.pipe(
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
              For help along the way.
            </p>
            <div className="relative h-96">
              <div className="absolute w-screen left-1/2 top-6 transform -translate-x-1/2 h-70 flex justify-center z-20">
                <ProductsCarousel
                  slug={slug}
                  input$={recipeData$.pipe(
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
              Dive deeper with experts.
            </p>
            <div className="relative h-96">
              <div className="absolute w-screen left-1/2 top-6 transform -translate-x-1/2 h-70 flex justify-center z-20">
                <ProductsCarousel
                  slug={slug}
                  input$={recipeData$.pipe(
                    map((recipe) => ({ recipe, type: "book" }))
                  )}
                />
              </div>
            </div>
          </Card> */}
        </div>
      </div>
    </>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const recipe = await getRecipe(params.slug);
  let name, description;
  if (!recipe) {
    const recipeKey = `recipe:${params.slug}`;
    const data = await kv.hgetall(recipeKey);
    const tempRecipe = RecipeBaseSchema.parse(data);
    ({ name, description } = tempRecipe);
  } else {
    ({ name, description } = recipe);
  }
  const creatorSlug = ` by @${recipe?.createdBySlug}` || "";
  const title = `${name}${creatorSlug}`;

  const now = recipe?.createdAt || new Date(); // todo actually store this on the recipe
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(now);
  const dateStr = formattedDate.split(" at ").join(" @ ");
  const images = [
    {
      url: env.KITCHENCRAFT_URL + `/recipe/${params.slug}/opengraph-image`,
      secure_url:
        env.KITCHENCRAFT_URL + `/recipe/${params.slug}/opengraph-image`,
      width: 1200,
      height: 630,
    },
  ];

  // todo add updatedTime
  return {
    title,
    metadataBase: new URL(env.KITCHENCRAFT_URL),
    openGraph: {
      siteName: "KitchenCraft",
      title,
      description: `${recipe?.description} Crafted by ${creatorSlug} on ${dateStr}`,
      images,
    },
    twitter: {
      site: "@kitchenAI",
      title,
      description: `${recipe?.description} Crafted by ${creatorSlug} on ${dateStr}`,
      images,
    },
  };
}
