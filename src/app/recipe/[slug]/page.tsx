import { FAQsTokenStream } from "@/app/api/recipe/[slug]/faqs/stream";
import { Header } from "@/app/header";
import Generator from "@/components/ai/generator";
import { Badge } from "@/components/display/badge";
import { Card } from "@/components/display/card";
import { Separator } from "@/components/display/separator";
import { Skeleton } from "@/components/display/skeleton";
import { EventButton } from "@/components/event-button";
import { Button } from "@/components/input/button";
import { CommandGroup, CommandItem } from "@/components/input/command";

import { env } from "@/env.public";
import { getResult } from "@/lib/db";
import { noop, waitForStoreValue } from "@/lib/utils";
import {
  CompletedRecipeSchema,
  QuestionsPredictionOutputSchema,
  RecipeSchema,
  SuggestionPredictionInputSchema,
} from "@/schema";
import { RecipePredictionInput } from "@/types";
import { kv } from "@vercel/kv";
import {
  ArrowBigUpDashIcon,
  ArrowLeftRightIcon,
  CameraIcon,
  ChefHatIcon,
  HelpCircle,
  Link,
  MicrowaveIcon,
  NutOffIcon,
  PlusSquareIcon,
  PrinterIcon,
  ScaleIcon,
  ScrollIcon,
  ShareIcon,
  ShoppingBasketIcon,
  ShuffleIcon,
} from "lucide-react";
import { map } from "nanostores";
import { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import React, { ComponentProps, ReactNode, Suspense } from "react";
import { AddButton } from "./add-button";
import {
  RemixCommand,
  RemixCommandGroup,
  RemixCommandInput,
} from "./components.client";
import { CraftingDetails } from "./crafting-details";
import { IngredientList } from "./ingredient-list";
import { InstructionList } from "./instruction-list";
import { UploadedMediaSchema } from "./media/schema";
import { UploadedMedia } from "./media/types";
import { contentType, size } from "./opengraph-image";
import { PrintButton } from "./print-button";
import RecipeGenerator from "./recipe-generator";
import { StoreProps } from "./schema";
import { ShareButton } from "./share-button";
import {
  SousChefCommand,
  SousChefCommandInput,
  SousChefCommandItem,
  SousChefOutput,
  SousChefPromptCommandGroup,
} from "./sous-chef-command/components";
import { Tags } from "./tags";
import { Times } from "./times";
import { UploadMediaButton } from "./upload-media-button";
import { UpvoteButton } from "./upvote-button";
import { getRecipe } from "./utils";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Props = {
  params: { slug: string };
};

export default async function Page(props: Props) {
  const { slug } = props.params;
  const recipeKey = `recipe:${slug}`;

  const data = await kv.hgetall(recipeKey);
  const recipe = RecipeSchema.parse(data);
  const { runStatus } = recipe;

  const isDone = runStatus === "done";
  const isError = runStatus === "error";
  const isInitializing = runStatus === "initializing";
  const loading = !isDone && !isError;

  if (isError) {
    const error = (await kv.hget(`recipe:${slug}`, "error")) as string;
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

  let input: RecipePredictionInput;
  if (recipe.fromResult) {
    const result = await getResult(kv, recipe.fromResult.resultId);
    const suggestionsInput = SuggestionPredictionInputSchema.parse(
      result.input
    );

    input = {
      type: "NEW_RECIPE_FROM_SUGGESTIONS",
      recipe: {
        name: recipe.name,
        description: recipe.description,
      },
      suggestionsInput,
    } satisfies RecipePredictionInput;
  } else if (recipe.fromPrompt) {
    input = {
      type: "NEW_INSTANT_RECIPE",
      recipe: {
        name: recipe.name,
        description: recipe.description,
      },
      prompt: recipe.fromPrompt,
    } satisfies RecipePredictionInput;
  } else {
    return notFound();
  }

  const store = map<StoreProps>({
    loading,
    recipe,
  });

  const WaitForRecipe = async ({ children }: { children: ReactNode }) => {
    await waitForStoreValue(store, (state) => {
      if (!state.loading) return true;
    });
    return <>{children}</>;
  };

  const AssistantContent = () => {
    const faqStore = map<{ loading: boolean; questions: string[] }>({
      loading: true,
      questions: [],
    });

    const FAQGenerator = async () => {
      const recipeTokenStream = new FAQsTokenStream();
      const input = {
        recipe: CompletedRecipeSchema.parse(store.get().recipe),
      };

      const stream = await recipeTokenStream.getStream(input);

      return (
        <Generator
          stream={stream}
          schema={QuestionsPredictionOutputSchema}
          onProgress={({ questions }) => {
            if (questions) {
              faqStore.setKey("questions", questions);
            }
          }}
          onComplete={({ questions }) => {
            faqStore.setKey("questions", questions);
            faqStore.setKey("loading", false);
          }}
        />
      );
    };

    const items = new Array(6).fill(0);

    const SousChefFAQSuggestionCommandItem = async ({
      index,
    }: ComponentProps<typeof CommandItem> & { index: number }) => {
      const text = await waitForStoreValue(faqStore, (state) => {
        const nextQuestionExists = !!state.questions[index + 1];
        if (nextQuestionExists || !state.loading) {
          return state.questions[index];
        }
      });

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
            <Suspense fallback={<Skeleton className={"w-full h-20"} />}>
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

  // const remix = async (prompt: string) => {
  //   "use server";
  //   redirect(`/recipe/${slug}/remix?prompt=${prompt}&modification=free_text`);
  // };

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

  const mainMediaId = store.get().recipe.previewMediaIds[0];
  let mainMedia: UploadedMedia | undefined;
  if (mainMediaId) {
    mainMedia = UploadedMediaSchema.parse(
      await kv.hgetall(`media:${mainMediaId}`)
    );
  }

  const Name = () => {
    return <>{store.get().recipe.name}</>;
  };

  async function Yields() {
    const recipeYield = await waitForStoreValue(store, (state) => {
      if (state.recipe.activeTime && state.recipe.yield) {
        return state.recipe.yield;
      }
    });
    return <>{recipeYield}</>;
  }

  return (
    <div className="flex flex-col gap-2 max-w-2xl mx-auto">
      <div>
        <Header />
        {/* {mainMediaId ? (
          <div className="w-full aspect-square overflow-hidden relative rounded-b-xl shadow-md">
            <Header className="absolute left-0 right-0 top-0 z-10" />
            <Suspense fallback={<Skeleton className="w-full h-20" />}>
              <MediaCarousel
                previewMedia={z
                  .array(UploadedMediaSchema)
                  .parse(
                    await Promise.all(
                      store
                        .get()
                        .recipe.previewMediaIds.map((id) =>
                          kv.hgetall(`media:${id}`)
                        )
                    )
                  )}
              />
            </Suspense>
          </div>
        ) : (
          <Header />
        )} */}
      </div>
      <div className="flex flex-col gap-2">
        <Card className="flex flex-col gap-2 pb-5 mx-3">
          {isInitializing && (
            <Suspense fallback={null}>
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
                    store.setKey("recipe", {
                      ...recipe,
                      ...output.recipe,
                    });
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
                  store.setKey("recipe", {
                    ...recipe,
                    runStatus: "done",
                    ...output.recipe,
                  });

                  kv.hset(`recipe:${slug}`, {
                    runStatus: "done",
                    ...output.recipe,
                  }).then(() => {
                    console.log("DONE LOADING!");
                    store.setKey("loading", false);
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
          {/* <RecipeContents store={store} {...recipe} /> */}
          <>
            <div className="flex flex-row gap-3 p-5 justify-between">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold">
                  <Name />
                </h1>
                <p className="text-lg text-muted-foreground">
                  {store.get().recipe.description}
                </p>
                <div className="text-sm text-muted-foreground flex flex-row gap-2 items-center">
                  <span>Yields</span>
                  <span>
                    <Suspense fallback={<Skeleton className="w-24 h-5" />}>
                      <Yields />
                    </Suspense>
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1 hidden-print">
                <AddButton>
                  <PlusSquareIcon />
                </AddButton>
                <UploadMediaButton slug={store.get().recipe.slug}>
                  <CameraIcon />
                </UploadMediaButton>
                <PrintButton>
                  <PrinterIcon />
                </PrintButton>
                <ShareButton>
                  <ShareIcon />
                </ShareButton>
                <UpvoteButton>
                  <ArrowBigUpDashIcon />
                  <span className="font-bold">1</span>
                </UpvoteButton>
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
                <CraftingDetails
                  createdAt={
                    store.get().recipe.createdAt || Date.now().toString()
                  }
                />
              </div>
            </div>
            <Separator className="hidden-print" />
            <Times store={store} />
            <Separator />
            <Tags store={store} />
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
                  <ul className="list-disc pl-5">
                    <IngredientList store={store} />
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
                  <ol className="list-decimal pl-5">
                    <InstructionList store={store} />
                  </ol>
                </Suspense>
              </div>
            </div>
          </>
        </Card>
        <Card id="remix" className="mx-3 mb-3">
          <RemixContent />
        </Card>
        <Card id="assistant" className="mx-3 mb-3">
          <AssistantContent />
        </Card>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const recipe = await getRecipe(params.slug);
  const title = `${recipe.name} by @InspectorT | KitchenCraft.ai`;

  const mainMediaId = recipe.previewMediaIds[0];
  let mainMedia: UploadedMedia | undefined;
  if (mainMediaId) {
    mainMedia = UploadedMediaSchema.parse(
      await kv.hgetall(`media:${mainMediaId}`)
    );
  }

  const now = new Date(); // todo actually store this on the recipe
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(now);
  const dateStr = formattedDate.split(" at ").join(" @ ");

  const images = mainMedia
    ? [
        {
          url: env.KITCHENCRAFT_URL + `/recipe/${recipe.slug}/opengraph-image`,
          secure_url:
            env.KITCHENCRAFT_URL + `/recipe/${recipe.slug}/opengraph-image`,
          type: contentType,
          width: size.width,
          height: size.height,
        },
      ]
    : undefined;

  // todo add updatedTime
  return {
    title,
    metadataBase: new URL(env.KITCHENCRAFT_URL),
    openGraph: {
      title,
      description: `${recipe.description} Crafted by @InspectorT on ${dateStr}`,
      images,
    },
  };
}
