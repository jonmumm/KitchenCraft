import { FAQsTokenStream } from "@/app/api/recipe/[slug]/faqs/stream";
import { Header } from "@/app/header";
import { EventButton } from "@/components/event-button";
import Generator from "@/components/generator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

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
  ArrowLeftRightIcon,
  ChefHatIcon,
  HelpCircle,
  MicrowaveIcon,
  NutOffIcon,
  ScaleIcon,
  ShuffleIcon,
} from "lucide-react";
import { map } from "nanostores";
import { Metadata } from "next";
import { revalidatePath } from "next/cache";
import React, { ComponentProps, ReactNode, Suspense } from "react";
import { z } from "zod";
import { MediaCarousel } from "./media-carousel/components.client";
import { UploadedMediaSchema } from "./media/schema";
import { UploadedMedia } from "./media/types";
import { contentType, size } from "./opengraph-image";
import { RecipeContents } from "./recipe-contents";
import RecipeGenerator from "./recipe-generator";
import { StoreProps } from "./schema";
import {
  SousChefCommand,
  SousChefCommandInput,
  SousChefCommandItem,
  SousChefOutput,
  SousChefPromptCommandGroup,
} from "./sous-chef-command/components";
import { getRecipe } from "./utils";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

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
    console.log(error);
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

  const result = await getResult(kv, recipe.fromResult.resultId);
  const suggestionsInput = SuggestionPredictionInputSchema.parse(result.input);

  const input = {
    type: "NEW_RECIPE",
    recipe: {
      name: recipe.name,
      description: recipe.description,
    },
    suggestionsInput,
  } satisfies RecipePredictionInput;

  const store = map<StoreProps>({
    loading,
    recipe,
  });

  const WaitForRecipe = async ({ children }: { children: ReactNode }) => {
    await waitForStoreValue(store, (state) => {
      if (state.loading) {
        return undefined;
      }
      return true;
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
    console.log({ mainMediaId });
    mainMedia = UploadedMediaSchema.parse(
      await kv.hgetall(`media:${mainMediaId}`)
    );
  }
  console.log(store.get().recipe.previewMediaIds);

  return (
    <div className="flex flex-col gap-2 max-w-2xl mx-auto">
      <div>
        {mainMediaId ? (
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
        )}
      </div>
      {/* <Header /> */}
      <div className="flex flex-col gap-2">
        <Card className="flex flex-col gap-2 pb-5 mx-3">
          {isInitializing && (
            <Suspense fallback={null}>
              <RecipeGenerator
                input={{
                  type: "NEW_RECIPE",
                  recipe: {
                    name: recipe.name,
                    description: recipe.description,
                  },
                  suggestionsInput: input.suggestionsInput,
                }}
                onStart={() => {
                  kv.hset(`recipe:${slug}`, {
                    runStatus: "started",
                    input,
                  }).then(noop);
                }}
                onProgress={(output) => {
                  if (output.recipe) {
                    store.setKey("recipe", {
                      ...recipe,
                      ...output.recipe,
                    });
                  }
                }}
                onError={(error, outputRaw) => {
                  console.log("error");
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
          <RecipeContents store={store} {...recipe} />
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
    console.log({ mainMediaId });
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
    openGraph: {
      title,
      description: `${recipe.description} Crafted by @InspectorT on ${dateStr}`,
      images,
    },
  };
}
