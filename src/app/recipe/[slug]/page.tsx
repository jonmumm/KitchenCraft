import { Card } from "@/components/display/card";
import { Skeleton } from "@/components/display/skeleton";
import { unstable_noStore as noStore } from "next/cache";
import { Recipe as RecipeJSONLDSchema, WithContext } from "schema-dts";

import { TipsAndTricksTokenStream } from "@/app/api/recipe/[slug]/tips-and-tricks/stream";
import { Avatar, RobotAvatarImage } from "@/components/display/avatar";
import { Badge } from "@/components/display/badge";
import MarkdownRenderer from "@/components/display/markdown";
import { Separator } from "@/components/display/separator";
import { FavoriteButton } from "@/components/favorite-button";
import { Button } from "@/components/input/button";
import { PrintButton } from "@/components/print-button";
import { RecipeMoreDropdownButton } from "@/components/recipe-more-dropdown-button";
import { RecipeSelectButton } from "@/components/recipe-select-button";
import { ShareButton } from "@/components/share-button";
import { db } from "@/db";
import {
  findLatestRecipeVersion,
  findSlugForRecipeVersion,
  getRecipe,
} from "@/db/queries";
import { env } from "@/env.public";
import { getCurrentProfile, getCurrentUserId } from "@/lib/auth/session";
import { delay, formatDuration, sentenceToSlug } from "@/lib/utils";
import { CommentsProvider } from "@/modules/comments/components";
import {
  RecipeCommentsContent,
  RecipeCommentsItems,
  RecipeCommentsTexarea,
} from "@/modules/comments/components.client";
import { MediaGalleryProvider } from "@/modules/media-gallery/components";
import {
  MediaGallery,
  MediaGalleryContainer,
  MediaGalleryItems,
} from "@/modules/media-gallery/components.client";
import {
  AxeIcon,
  ClockIcon,
  GitForkIcon,
  LightbulbIcon,
  MessageSquareIcon,
  ScrollIcon,
  ShoppingBasketIcon,
  StarIcon,
  TagIcon,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { TipsAndTricksContent } from "./components.client";
import { getAllVersionsOfRecipeBySlug } from "./history/queries";
import { Rating } from "./rating/components.client";
import {
  getCurrentUserRatingBySlug,
  upsertRecipeRating,
} from "./rating/queries";
import { RatingValue } from "./rating/types";

// export const maxDuration = 300;
// export const dynamic = "force-dynamic";
// export const revalidate = 10;

type Props = {
  params: { slug: string };
};

export default async function Page(props: Props) {
  const { slug } = props.params;
  const [
    recipe,
    userId,
    // mediaList,
    latestVersion,
    versions,
    rating,
  ] = await Promise.all([
    getRecipe(slug),
    getCurrentUserId(),
    // getSortedMediaForRecipe(slug),
    findLatestRecipeVersion(slug),
    getAllVersionsOfRecipeBySlug(db, slug),
    getCurrentUserRatingBySlug(slug),
  ]);

  if (!recipe) {
    return <h1>Not Found</h1>;
  }

  if (latestVersion && recipe.versionId !== latestVersion.versionId) {
    const slug = await findSlugForRecipeVersion(
      db,
      recipe.id,
      latestVersion.versionId
    );
    return redirect(`/recipe/${slug}`);
  }

  const submitRating = async (
    slug: string,
    userId: string,
    value: RatingValue
  ) => {
    "use server";
    console.log(userId, slug, value);
    await upsertRecipeRating(db, userId, slug, value);
  };

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
                  <Badge variant="outline">Version {index}</Badge>
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
              <div className="timeline-end pt-8 pb-16">
                <div>
                  <h3 className="text-sm font-medium inline-block">
                    {version.name}
                  </h3>
                </div>
                {version.prompt.length ? (
                  <span className="text-muted-foreground text-sm italic">
                    &quot;{version.prompt}.&quot;
                  </span>
                ) : (
                  <></>
                )}
                {version.tokens.length ? (
                  <div className="flex flex-row flex-wrap py-2 gap-2">
                    {version.tokens.map((token) => {
                      return (
                        <Badge variant="secondary" key={token}>
                          {token}
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <></>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="flex flex-row gap-2"
                  event={{
                    type: "NEW_RECIPE",
                    prompt: version.prompt,
                    tokens: version.tokens,
                  }}
                >
                  <AxeIcon size={14} />
                  Open Prompt
                </Button>
              </div>
              <hr />
            </li>
            <li>
              <hr />
              <div className="timeline-middle">
                <Link href={`?crafting=1&prompt=${latestVersion?.prompt}`}>
                  <Button
                    variant="secondary"
                    event={{
                      type: "REMIX",
                      slug,
                    }}
                    className="flex flex-row gap-1"
                  >
                    {/* <AxeIcon size={17} /> */}
                    <span className="text-xs">🧪</span>
                    <span>Remix</span>
                  </Button>
                </Link>
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
              <Versions />
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

  const { name, description } = recipe;

  return (
    <>
      <Suspense fallback={null}>
        <Schema />
      </Suspense>

      <CommentsProvider slug={slug}>
        <MediaGalleryProvider slug={slug} minHeight={"50vh"}>
          <div className="flex flex-col gap-2">
            <MediaGalleryContainer>
              <MediaGallery>
                {/* Empty item as a spacer, maybe better way? */}
                <div className="w-1 h-full carousel-item" />
                <MediaGalleryItems />
              </MediaGallery>
            </MediaGalleryContainer>
            <div className="flex flex-col gap-2 max-w-xl mx-auto">
              <Card className="flex flex-col gap-2 pb-5 mx-3">
                <div className="flex flex-row gap-3 p-5 justify-between">
                  <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold">{name}</h1>
                    <p className="text-lg text-muted-foreground">
                      {description}
                    </p>
                    <div className="text-sm text-muted-foreground flex flex-row gap-2 items-center">
                      <span>Yields</span>
                      <span>{recipe.yield}</span>
                    </div>
                  </div>

                  {/* <div className="flex flex-col gap-1 hidden-print">
                    <SaveButton initialIsSaved={false} />
                    <UploadMediaButton slug={slug}>
                      <CameraIcon />
                    </UploadMediaButton>
                    <Link href="#comments">
                      <Button variant="outline" className="w-full">
                        <MessageSquareIcon />
                      </Button>
                    </Link>
                    <ShareButton
                      slug={slug}
                      name={name}
                      description={description}
                    />
                  </div> */}
                </div>
                <Separator />
                <div className="flex flex-row gap-2 py-2 max-w-xl mx-auto justify-center px-4 w-full">
                  {/* <Button className="flex-1 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white">
                    Select <CheckIcon className="ml-2" />
                  </Button> */}
                  <PrintButton slug={recipe?.slug} />
                  <ShareButton slug={slug} name={name} />
                  <FavoriteButton slug={recipe?.slug} />
                  <RecipeSelectButton id={recipe.id} />
                  <RecipeMoreDropdownButton />
                </div>
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
                {/* <Times
                  totalTime$={totalTime$}
                  activeTime$={activeTime$}
                  cookTime$={cookTime$}
                /> */}
                <div>
                  <Times
                    activeTime={recipe.activeTime}
                    totalTime={recipe.totalTime}
                    cookTime={recipe.cookTime}
                  />
                  {/* <SkeletonSentence className="h-4" numWords={12} /> */}
                </div>
                <Separator />
                <Tags tags={recipe.tags} />
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
                        {/* <Ingredients ingredients$={ingredients$} /> */}
                        <Ingredients ingredients={recipe.ingredients} />
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
                    <ol className="list-decimal pl-5 flex flex-col gap-2">
                      <Instructions instructions={recipe.instructions} />
                    </ol>
                  </div>
                </div>
              </Card>
              <Card id="rating" className="mx-3">
                <div className="flex flex-row gap-2 items-center justify-between py-4 px-5">
                  <h3 className="uppercase text-xs font-bold text-accent-foreground">
                    Rating
                  </h3>
                  <StarIcon />
                </div>
                <Separator />
                <div className="p-4 flex justify-center">
                  <Rating
                    defaultValue={(rating?.value as RatingValue) || 0}
                    lastRatedAt={rating?.createdAt}
                    submitValueChange={
                      userId
                        ? submitRating.bind(null, slug).bind(null, userId)
                        : undefined
                    }
                  />
                </div>
              </Card>
              {/* <CommentsCard /> */}
              <Card id="history" className="mx-3">
                <History />
              </Card>
              {/* <Card id="assistant" className="mx-3">
                  <AssistantContent />
              </Card> */}
              {/* <Card id="tips-and-tricks" className="mx-3">
                <TipsAndTricks />
              </Card> */}
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
                    <AffiliateProductCarousel
                      slug={slug}
                      productType={"ingredient"}
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
                    <AffiliateProductCarousel
                      slug={slug}
                      productType={"equipment"}
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
                    <AffiliateProductCarousel
                      slug={slug}
                      productType={"book"}
                    />
                  </div>
                </div>
              </Card> */}
            </div>
          </div>
        </MediaGalleryProvider>
      </CommentsProvider>
    </>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const recipe = await getRecipe(params.slug);
  if (!recipe) {
    return {
      title: "Not Found",
    };
  }
  const { name, description } = recipe;
  const creatorSlug = recipe?.createdBySlug
    ? ` by @${recipe?.createdBySlug}`
    : ` by ChefAnonymous`;
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
      description: `${recipe?.description} Crafted${creatorSlug} on ${dateStr}`,
      images,
    },
    twitter: {
      site: "@kitchenAI",
      title,
      description: `${recipe?.description} Crafted${creatorSlug} on ${dateStr}`,
      images,
    },
  };
}

// const AssistantContent = () => {
//   const faq$ = new BehaviorSubject<string[]>([]);

//   const FAQGenerator = async ({
//     recipeData,
//   }: {
//     recipeData: ObservableType<typeof recipeData$>;
//   }) => {
//     const data = await kv.get(`recipe:${slug}:questions`);
//     if (data) {
//       const existingQuestionsResult =
//         QuestionsPredictionOutputSchema.shape.questions.safeParse(data);
//       if (existingQuestionsResult.success) {
//         faq$.next(existingQuestionsResult.data);
//         faq$.complete();
//         return null;
//       } else {
//         console.error(existingQuestionsResult.error);
//       }
//     }
//     const recipeTokenStream = new FAQsTokenStream();

//     const input = FAQsPredictionInputSchema.parse({
//       recipe: recipeData,
//     });
//     const stream = await recipeTokenStream.getStream(input);

//     return (
//       <Generator
//         stream={stream}
//         schema={QuestionsPredictionOutputSchema}
//         onStart={() => {}}
//         onProgress={({ questions }) => {
//           if (questions) {
//             faq$.next(questions);
//           }
//         }}
//         onComplete={({ questions }) => {
//           faq$.next(questions);
//           kv.set(`recipe:${slug}:questions`, questions);
//           faq$.complete();
//         }}
//       />
//     );
//   };

//   const NUM_FAQ_SUGGESTIONS = 6;
//   const items = new Array(NUM_FAQ_SUGGESTIONS).fill(0);

//   const SousChefFAQSuggestionCommandItem = async ({
//     index,
//   }: ComponentProps<typeof CommandItem> & { index: number }) => {
//     const text = await lastValueFrom(
//       faq$.pipe(
//         map((items) => {
//           const item = items[index];
//           const nextItemExists = !!items?.[index + 1];
//           return { item, nextItemExists };
//         }),
//         takeWhile(({ nextItemExists }) => !nextItemExists, true),
//         map(({ item }) => item),
//         defaultIfEmpty(undefined)
//       )
//     );

//     return (
//       <SousChefCommandItem
//         key={index}
//         value={text}
//         className="flex flex-row gap-2"
//       >
//         <Suspense fallback={<Skeleton className="w-full h-6" />}>
//           <Button size="icon" variant="secondary">
//             <HelpCircle className="opacity-40" />
//           </Button>
//           <h4 className="text-sm flex-1">{text}</h4>
//         </Suspense>
//         <Badge variant="secondary">Ask</Badge>
//       </SousChefCommandItem>
//     );
//   };

//   return (
//     <>
//       <Suspense fallback={null}>
//         <AsyncRenderFirstValue
//           observable={recipeData$}
//           render={(recipeData) => <FAQGenerator recipeData={recipeData} />}
//           fallback={null}
//         />
//       </Suspense>
//       <div className="px-5" id="assistant">
//         <div className="flex flex-row justify-between gap-1 items-center py-4">
//           <h3 className="uppercase text-xs font-bold text-accent-foreground">
//             Assistant
//           </h3>
//           <MessagesSquareIcon />
//         </div>
//       </div>
//       <SousChefCommand slug={slug}>
//         <SousChefCommandInput />
//         <Separator />
//         <Suspense fallback={null}>
//           <WaitForRecipe>
//             <SousChefPromptCommandGroup />
//           </WaitForRecipe>
//         </Suspense>
//         <SousChefOutput />
//         <SousChefFAQSuggestionsCommandGroup
//           defaultValue={undefined}
//           heading="Questions"
//         >
//           <Suspense
//             fallback={
//               <>
//                 {items.map((_, index) => {
//                   return (
//                     <SousChefCommandItem
//                       disabled={true}
//                       key={index}
//                       className="flex flex-row gap-2"
//                     >
//                       <Button size="icon" variant="secondary">
//                         <HelpCircle className="opacity-40" />
//                       </Button>
//                       <div className="flex-1">
//                         <SkeletonSentence
//                           className="h-4"
//                           numWords={[5, 7, 10]}
//                         />
//                       </div>
//                       <Badge className="opacity-50" variant="secondary">
//                         Ask
//                       </Badge>
//                     </SousChefCommandItem>
//                   );
//                 })}
//               </>
//             }
//           >
//             <WaitForRecipe>
//               {items.map((_, index) => {
//                 return (
//                   <SousChefFAQSuggestionCommandItem
//                     key={index}
//                     index={index}
//                     className="flex flex-row gap-2"
//                   />
//                 );
//               })}
//             </WaitForRecipe>
//           </Suspense>
//         </SousChefFAQSuggestionsCommandGroup>
//       </SousChefCommand>
//     </>
//   );
// };

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

const Tags = ({ tags }: { tags: string[] }) => {
  const Tag = ({ index }: { index: number }) => {
    const tag = tags[index];
    if (!tag) {
      return (
        <Badge variant="outline" className="inline-flex flex-row gap-1 px-2">
          <Skeleton className="w-8 h-4" />
        </Badge>
      );
    }
  };

  return (
    <div className="flex flex-row flex-wrap gap-2 px-5 px-y hidden-print items-center justify-center">
      <TagIcon size={16} className="h-5" />
      {tags.map((tag, index) => {
        return (
          <Link href={`/tag/${sentenceToSlug(tag)}`} key={tag}>
            <Badge
              variant="outline"
              className="inline-flex flex-row gap-1 px-2"
            >
              {tag}
            </Badge>
          </Link>
        );
      })}
      {/* <AddTagButton /> */}
    </div>
  );
};

// copied from @craft commponents.client
const Times = ({
  cookTime,
  totalTime,
  activeTime,
}: {
  cookTime?: string;
  totalTime?: string;
  activeTime?: string;
}) => {
  // const store = useContext(RecipeViewerContext);
  // const { prepTime, cookTime, totalTime } = useStore(store, {
  //   keys: ["prepTime", "cookTime", "totalTime"],
  // });

  const ActiveTime = () => {
    return <>{formatDuration(activeTime)}</>;
  };

  const CookTime = () => {
    return <>{formatDuration(cookTime)}</>;
  };

  const TotalTime = () => {
    return <>{formatDuration(totalTime)}</>;
  };

  return (
    <div className="flex flex-row gap-2 px-5 py-2 items-center justify-center">
      <ClockIcon size={16} className="h-5" />
      <div className="flex flex-row gap-1">
        <Badge variant="secondary" className="inline-flex flex-row gap-1 px-2">
          <span className="font-normal">Cook </span>
          {cookTime ? (
            <CookTime />
          ) : (
            <Skeleton className="w-5 h-4 bg-slate-500" />
          )}
        </Badge>
        <Badge variant="secondary" className="inline-flex flex-row gap-1 px-2">
          <span className="font-normal">Active </span>
          {activeTime ? (
            <ActiveTime />
          ) : (
            <Skeleton className="w-5 h-4 bg-slate-500" />
          )}
        </Badge>
        <Badge variant="secondary" className="inline-flex flex-row gap-1 px-2">
          <span className="font-normal">Total </span>
          {totalTime ? (
            <TotalTime />
          ) : (
            <Skeleton className="w-5 h-4 bg-slate-500" />
          )}
        </Badge>
      </div>
    </div>
  );
};

function Ingredients({ ingredients }: { ingredients: string[] }) {
  const NUM_LINE_PLACEHOLDERS = 5;

  const Item = ({ index }: { index: number }) => {
    return <li>{ingredients[index]}</li>;
  };

  return (
    <>
      {ingredients.map((_, index) => {
        return <Item key={index} index={index} />;
      })}
    </>
  );
}

function Instructions({ instructions }: { instructions: string[] }) {
  const NUM_LINE_PLACEHOLDERS = 5;

  const Item = ({ index }: { index: number }) => {
    return <li>{instructions[index]}</li>;
  };

  return (
    <>
      {instructions.map((_, index) => {
        return <Item key={index} index={index} />;
      })}
    </>
  );
}

const CommentsCard = async () => {
  const currentProfile = await getCurrentProfile();

  return (
    <Card id="comments" className="mx-3">
      <div className="flex flex-row gap-2 items-center justify-between py-4 px-5">
        <h3 className="uppercase text-xs font-bold text-accent-foreground">
          Comments
        </h3>
        <MessageSquareIcon />
      </div>
      <Separator />
      <div className="p-4">
        {currentProfile && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-3">
              <Avatar className="w-10 h-10">
                <RobotAvatarImage alt={currentProfile.profileSlug} />
              </Avatar>
              <div className="text-sm font-medium">
                @{currentProfile.profileSlug}
              </div>
            </div>

            <RecipeCommentsTexarea />
            <Button event={{ type: "SUBMIT" }} className="w-full">
              Post Comment
            </Button>
          </div>
        )}
        <RecipeCommentsContent>
          <div className="mt-4 space-y-4">
            <RecipeCommentsItems />
          </div>
        </RecipeCommentsContent>
      </div>
    </Card>
  );
};
