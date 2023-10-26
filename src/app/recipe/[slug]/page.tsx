import { Header } from "@/app/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration, noop, waitForStoreValue } from "@/lib/utils";
import { SuggestionPredictionInputSchema, RecipeSchema } from "@/schema";
import { RecipePredictionInput, RecipeSlug } from "@/types";
import { kv } from "@vercel/kv";
import { ChatPromptTemplate } from "langchain/prompts";
import {
  ArrowBigUpDashIcon,
  CameraIcon,
  ChefHatIcon,
  ClockIcon,
  ListPlusIcon,
  PlusIcon,
  PlusSquareIcon,
  PrinterIcon,
  ScrollIcon,
  ShareIcon,
  ShoppingBasketIcon,
  ShuffleIcon,
  TagIcon,
} from "lucide-react";
import { MapStore, map } from "nanostores";
import { Metadata } from "next";
import Link from "next/link";
import { ReactNode, Suspense, useCallback } from "react";
import { AddButton } from "./add-button";
import { PrintButton } from "./print-button";
import RecipeGenerator from "./recipe-generator";
import { StoreProps } from "./schema";
import { ShareButton } from "./share-button";
import { UploadMediaButton } from "./upload-media-button";
import { UpvoteButton } from "./upvote-button";
import { AddTagButton } from "./add-tag-button";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Props = {
  params: { slug: string };
};

export default async function Page(props: Props) {
  const { slug } = props?.params;
  const recipeKey = `recipe:${slug}`;

  await kv.hsetnx(recipeKey, "runStatus", "initializing");

  const recipe = RecipeSchema.parse(await kv.hgetall(recipeKey));
  if (!recipe.createdAt) {
    const createdAt = new Date().toISOString();
    kv.hsetnx(recipeKey, "createdAt", createdAt).then(noop);
    recipe.createdAt = createdAt;
  }
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

  const suggestionInput = SuggestionPredictionInputSchema.parse(
    await kv.hget(recipe.fromSuggestionsKey, "input")
  );

  // const parseResult = SuggestionPredictionInputSchema.safeParse(rawInput);

  const input = {
    name: recipe.name,
    description: recipe.description,
    suggestionsPrompt: suggestionInput.prompt,
    // suggestionsOutputYaml: jsYaml.dump(suggestions),
  } satisfies RecipePredictionInput;

  const store = map<StoreProps>({
    loading,
    recipe,
  });

  return (
    <div className="flex flex-col gap-2">
      <Header />
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
                    ...output.recipe,
                  });
                  kv.hset(`recipe:${slug}`, {
                    runStatus: "done",
                    ...output.recipe,
                  }).then(noop);
                  kv.zadd(`recipes:new`, {
                    score: Date.now(),
                    member: slug,
                  }).then(() => {
                    revalidatePath("/");
                  });

                  store.setKey("loading", false);
                }}
              />
            </Suspense>
          )}

          <div className="flex flex-row gap-3 p-5 justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold">{recipe.name}</h1>
              <p className="text-lg text-muted-foreground">
                {recipe.description}
              </p>
              <div className="text-sm text-muted-foreground flex flex-row gap-2 items-center">
                <span>Yields</span>
                <span>
                  <Suspense fallback={<Skeleton className="w-24 h-5" />}>
                    <Yield store={store} />
                  </Suspense>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 hidden-print">
              <AddButton>
                <PlusSquareIcon />
              </AddButton>
              <UploadMediaButton>
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
                <Link href={"#remix"}>
                  <ShuffleIcon />
                </Link>
              </Button>
            </div>
          </div>
          <Separator />
          <div className="flex flex-row gap-2 p-2 justify-center hidden-print">
            <div className="flex flex-col gap-2 items-center">
              <CraftingDetails createdAt={recipe.createdAt} />
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
                <ul className="list-disc pl-5">
                  <InstructionList store={store} />
                </ul>
              </Suspense>
            </div>
            {/* <RecipeInstructions store={store} /> */}
          </div>
        </Card>
        <Card id="remix" className="mx-3">
          {/* <RemixForm slug={params.slug}>
            <RemixHeader />
            <Separator />
            <RemixContent>
              <div className="flex flex-row gap-1 w-full">
                <RemixInput />
                <RemixButton />
              </div>
              <div className="flex flex-row gap-2 w-full">
                <div className="flex flex-row gap-2 text-muted-foreground text-sm items-center"></div>
              </div>
            </RemixContent>
          </RemixForm> */}
        </Card>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const recipe = await getRecipe(params.slug);
  const title = `${recipe.name} by @InspectorT | KitchenCraft.ai`;

  const now = new Date(); // todo actually store this on the recipe
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(now);
  const dateStr = formattedDate.split(" at ").join(" @ ");

  return {
    title,
    openGraph: {
      title,
      description: `${recipe.description} Crafted by @InspectorT on ${dateStr}`,
    },
  };
}

async function PrefillGroup(props: {
  name: string;
  slug: string;
  children: ReactNode;
}) {
  async function handleSubmit(data: FormData) {
    // const choices = data.get("choices");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge className="cursor-pointer" variant="outline">
          {props.name}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <form action={handleSubmit}>{props.children}</form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
async function PrefillGroupItem(props: { children: ReactNode }) {
  return <>{props.children}</>;

  // return <input type="hidden" name="prompt" value={item} />
  // <Button variant="ghost" type="submit">
  //   {item}
  // </Button>
}

// {["Make it keto"].map((item) => (
//   <DropdownMenuItem key={item}>
//     <form action={handleSelectPrompt}>
//       <input type="hidden" name="prompt" value={item} />
//       <Button variant="ghost" type="submit">
//         {item}
//       </Button>
//     </form>
//   </DropdownMenuItem>
// ))}

async function CraftingDetails({ createdAt }: { createdAt: string }) {
  const date = new Date(createdAt);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);

  return (
    <>
      <Label className="uppercase text-xs font-bold text-accent-foreground">
        Crafted By
      </Label>

      <Link
        href="/chef/InspectorT"
        className="flex flex-row gap-1 items-center"
      >
        <Badge variant="outline">
          <h3 className="font-bold text-xl">
            <div className="flex flex-col gap-1 items-center">
              <div className="flex flex-row gap-1 items-center">
                <ChefHatIcon />
                <span>
                  <span className="underline">InspectorT</span>
                </span>
              </div>
            </div>
          </h3>
        </Badge>{" "}
        <span className="font-bold">(+123 🧪)</span>
      </Link>
      <Label className="text-muted-foreground uppercase text-xs">
        {formattedDate.split(" at ").join(" @ ")}
      </Label>
    </>
  );
}

async function Yield({ store }: { store: MapStore<StoreProps> }) {
  const recipeYield = await waitForStoreValue(store, (state) => {
    if (state.recipe.activeTime && state.recipe.yield) {
      return state.recipe.yield;
    }
  });
  return <>{recipeYield}</>;
}

const Times = ({ store }: { store: MapStore<StoreProps> }) => {
  // const store = useContext(RecipeViewerContext);
  // const { prepTime, cookTime, totalTime } = useStore(store, {
  //   keys: ["prepTime", "cookTime", "totalTime"],
  // });

  const ActiveTime = async () => {
    const prepTime = await waitForStoreValue(store, (state) =>
      state.recipe.cookTime ? state.recipe.activeTime : undefined
    );
    const time = formatDuration(prepTime);
    return <>{time}</>;
  };

  const CookTime = async () => {
    const cookTime = await waitForStoreValue(store, (state) =>
      state.recipe.totalTime ? state.recipe.cookTime : undefined
    );
    const time = formatDuration(cookTime);
    return <>{time}</>;
  };

  const TotalTime = async () => {
    const totalTime = await waitForStoreValue(store, (state) =>
      state.recipe.tags?.length ? state.recipe.totalTime : undefined
    );
    const time = formatDuration(totalTime);
    return <>{time}</>;
  };

  return (
    <div className="flex flex-row gap-2 px-5 py-2 items-center justify-center">
      <ClockIcon className="h-5" />
      <div>
        <Badge variant="outline" className="inline-flex flex-row gap-1 px-2">
          <span>Cook </span>
          <Suspense fallback={<Skeleton className="w-10 h-4" />}>
            <CookTime />
          </Suspense>
        </Badge>
        <Badge variant="outline" className="inline-flex flex-row gap-1 px-2">
          <span>Active </span>
          <Suspense fallback={<Skeleton className="w-10 h-4" />}>
            <ActiveTime />
          </Suspense>
        </Badge>
        <Badge variant="outline" className="inline-flex flex-row gap-1 px-2">
          <span>Total </span>
          <Suspense fallback={<Skeleton className="w-10 h-4" />}>
            <TotalTime />
          </Suspense>
        </Badge>
      </div>
    </div>
  );
};

const Tags = ({ store }: { store: MapStore<StoreProps> }) => {
  const items = new Array(3).fill(0);

  const Tag = async ({ index }: { index: number }) => {
    const tag = await waitForStoreValue(
      store,
      ({ recipe: { tags, ingredients } }) => {
        if (!tags) {
          return;
        }

        const ingredientsExist = !!ingredients;
        const nextTagExists = !!tags[index + 1];

        const doneLoading = nextTagExists || ingredientsExist;

        if (doneLoading) {
          const tag = tags[index];
          return tag ? tag : null;
        }
      }
    );
    return (
      <>
        {tag ? (
          <Badge variant="outline" className="inline-flex flex-row gap-1 px-2">
            {tag}
          </Badge>
        ) : null}
      </>
    );
  };

  return (
    <div className="flex flex-row flex-wrap gap-2 px-5 px-y hidden-print items-center justify-center">
      <TagIcon className="h-5" />
      {items.map((_, index) => {
        return (
          <Suspense
            key={`tag-${index}`}
            fallback={<Skeleton className="w-14 h-4" />}
          >
            <Tag index={index} />
          </Suspense>
        );
      })}
      <AddTagButton />
    </div>
  );
};

const IngredientList = async ({ store }: { store: MapStore<StoreProps> }) => {
  await waitForStoreValue(store, (state) => state.recipe.ingredients?.length);
  const MAX_NUM_LINES = 30;
  const NUM_LINE_PLACEHOLDERS = 5;
  const items = new Array(MAX_NUM_LINES).fill(0);

  const Token = async ({
    index,
    itemIndex,
  }: {
    index: number;
    itemIndex: number;
  }) => {
    const token = await waitForStoreValue(store, (state) => {
      // todo add is loading logic here...
      const { ingredients, instructions } = state.recipe;
      if (!ingredients) {
        return;
      }

      const tokens = ingredients[itemIndex]?.split(" ");
      const token = tokens[index];
      const nextTokenExists = !!tokens[index + 1];
      const nextItemExists = !!ingredients[itemIndex + 1];
      const nextSectionExists = instructions?.length;

      const doneLoading =
        nextSectionExists ||
        nextItemExists ||
        nextTokenExists ||
        !state.loading;
      if (doneLoading) {
        return token ? token : null;
      }
    });

    return token ? <>{token} </> : null;
  };

  const Item = async ({ index }: { index: number }) => {
    const renderItem = await waitForStoreValue(store, ({ recipe, loading }) => {
      if (recipe.ingredients && recipe.ingredients[index]) {
        return true;
      }

      if (recipe.instructions || !loading) {
        return false;
      }
    });
    const MAX_NUM_TOKENS_PER_ROW = 40;
    const NUM_PLACEHOLDERS_TOKENS = 5;
    const tokens = new Array(MAX_NUM_TOKENS_PER_ROW).fill(0);

    return renderItem ? (
      <li>
        <span className="flex flex-row gap-1 flex-wrap">
          {tokens.map((_, tokenIndex) => {
            return (
              <Suspense
                fallback={
                  tokenIndex < NUM_PLACEHOLDERS_TOKENS ? (
                    <Skeleton className="w-6 h-4" />
                  ) : null
                }
                key={tokenIndex}
              >
                <Token index={tokenIndex} itemIndex={index} />
              </Suspense>
            );
          })}
        </span>
      </li>
    ) : null;
  };

  return (
    <>
      {items.map((_, index) => {
        return (
          <Suspense
            key={index}
            fallback={
              index < NUM_LINE_PLACEHOLDERS ? (
                <Skeleton className="w-full h-5" />
              ) : null
            }
          >
            <Item index={index} />
          </Suspense>
        );
      })}
    </>
  );
};

const InstructionList = async ({ store }: { store: MapStore<StoreProps> }) => {
  const MAX_NUM_LINES = 30;
  const NUM_LINE_PLACEHOLDERS = 5;
  await waitForStoreValue(store, (state) => state.recipe.instructions?.length);
  const items = new Array(MAX_NUM_LINES).fill(0);

  const Token = async ({
    index,
    itemIndex,
  }: {
    index: number;
    itemIndex: number;
  }) => {
    const token = await waitForStoreValue(store, (state) => {
      // todo add is loading logic here...
      const { instructions } = state.recipe;
      if (!instructions) {
        return;
      }

      const tokens = instructions[itemIndex]?.split(" ") || [];
      const token = tokens[index];
      const nextTokenExists = !!tokens[index + 1];
      const nextItemExists = !!instructions[itemIndex + 1];

      const doneLoading = nextItemExists || nextTokenExists || !state.loading;

      if (doneLoading) {
        return token ? token : null;
      }
    });

    return token ? <>{token} </> : null;
  };

  const Item = async ({ index }: { index: number }) => {
    const renderItem = await waitForStoreValue(store, ({ recipe, loading }) => {
      if (recipe.instructions && recipe.instructions[index]) {
        return true;
      }

      if (!loading) {
        return false;
      }
    });
    const MAX_NUM_TOKENS_PER_ROW = 80;
    const NUM_PLACEHOLDERS_TOKENS = 5;
    const tokens = new Array(MAX_NUM_TOKENS_PER_ROW).fill(0);

    return renderItem ? (
      <li>
        <span className="flex flex-row gap-1 flex-wrap">
          {tokens.map((_, tokenIndex) => {
            return (
              <Suspense
                fallback={
                  tokenIndex < NUM_PLACEHOLDERS_TOKENS ? (
                    <Skeleton className="w-10 h-4" />
                  ) : null
                }
                key={tokenIndex}
              >
                <Token index={tokenIndex} itemIndex={index} />
              </Suspense>
            );
          })}
        </span>
      </li>
    ) : null;
  };

  return (
    <>
      {items.map((_, index) => {
        return (
          <Suspense
            key={index}
            fallback={
              index < NUM_LINE_PLACEHOLDERS ? (
                <Skeleton className="w-full h-5" />
              ) : null
            }
          >
            <Item index={index} />
          </Suspense>
        );
      })}
    </>
  );
};

// const RecipeIngredients = ({ store }: { store: MapStore<StoreProps> }) => {
//   return (
//     <div className="mb-4 flex flex-col gap-2">
//       <Suspense fallback={<Skeleton className="w-full h-20" />}>
//         <ul className="list-disc pl-5">
//           <IngredientList />
//         </ul>
//       </Suspense>
//     </div>
//   );
// };

// const RecipeIngredients = ({ store }: { store: MapStore<StoreProps> }) => {
//   const NUM_INGREDIENT_PLACEHOLDER = 3;
//   const NUM_INGREDIENT_TOKENS = 3;

//   const RecipeIngredientToken = ({
//     itemIndex,
//     tokenIndex,
//   }: {
//     itemIndex: number;
//     tokenIndex: number;
//   }) => {
//     const ingredientToken = waitForStoreValue(store, ({ recipe }) => {
//       if (!recipe.ingredients) {
//         return undefined;
//       }

//       const ingredient = recipe.ingredients[itemIndex];
//       const nextIngredientExists = !!recipe.ingredients[itemIndex + 1];
//       const tokens = ingredient?.split(" ") || [];
//       const nextTokenExists = tokens[tokenIndex + 1];

//       const isTrailingToken = tokenIndex >= NUM_INGREDIENT_TOKENS - 1; // a token is trailing if its index is after the number of skeleton tokens we disploay prior to loading

//       const isLoaded =
//         (nextTokenExists && !isTrailingToken) ||
//         nextIngredientExists ||
//         !!recipe.instructions; // if we have any instructions it means all ingredients must exists

//       if (isLoaded) {
//         let token = tokens[tokenIndex];

//         // if this is the last placeholder token
//         // grab all the reamining tokens and also display them
//         if (token && tokenIndex === NUM_INGREDIENT_TOKENS - 1) {
//           token = tokens.slice(tokenIndex).join(" ");
//         }

//         if (token) {
//           return token;
//         } else if (isLoaded) {
//           return null;
//         }
//       }

//       // const tokens = recipe.recipeIngredients[ingredientIndex].split(" ");
//     });
//     return <>{ingredientToken}</>;
//   };

//   const RecipeIngredientItem = ({
//     tokenIndex,
//     index,
//   }: {
//     tokenIndex: number;
//     index: number;
//   }) => {
//     return (
//       <Suspense
//         key={`item-${index}-${tokenIndex}`}
//         fallback={<Skeleton className="w-10 h-4" />}
//       >
//         <RecipeIngredientToken itemIndex={index} tokenIndex={tokenIndex} />{" "}
//       </Suspense>
//     );
//   };

//   const AdditionalIngredients = async () => {
//     // wait to recipe instructions exists, which means ingredients are complete
//     await waitForStoreValue(
//       store,
//       (state) => state.recipe.instructions?.length
//     );
//     const numIngredients = await waitForStoreValue(
//       store,
//       (state) => state.recipe.ingredients?.length
//     );
//     assert(
//       numIngredients,
//       "expected num ingredients to be defined when showing additinal ingredients. recipe process in order assumed to be incorrect"
//     );

//     const moreToShow = numIngredients - NUM_INGREDIENT_PLACEHOLDER;

//     return moreToShow > 0
//       ? new Array(moreToShow).fill(0).map((_, index) => {
//           const itemIndex = index + NUM_INGREDIENT_PLACEHOLDER;
//           const tokens = new Array(NUM_INGREDIENT_TOKENS).fill(0);

//           return (
//             <li key={itemIndex}>
//               {tokens.map((_, tokenIndex) => {
//                 return (
//                   <RecipeIngredientItem
//                     key={tokenIndex}
//                     index={itemIndex}
//                     tokenIndex={tokenIndex}
//                   />
//                 );
//               })}
//             </li>
//           );
//         })
//       : null;
//   };

//   const items = new Array(NUM_INGREDIENT_PLACEHOLDER).fill(0);
//   return (
//     <div className="mb-4 flex flex-col gap-2">
//       <ul className="list-disc pl-5">
//         {/* // Always show first 5 as placeholders */}

//         {items.map((_, ingredientIndex) => {
//           const tokens = new Array(NUM_INGREDIENT_TOKENS).fill(0);

//           return (
//             <li key={ingredientIndex}>
//               {tokens.map((_, tokenIndex) => {
//                 return (
//                   <RecipeIngredientItem
//                     key={tokenIndex}
//                     index={ingredientIndex}
//                     tokenIndex={tokenIndex}
//                   />
//                 );
//               })}
//             </li>
//           );
//         })}
//         <Suspense fallback={<Skeleton className="w-20 h-5" />}>
//           <AdditionalIngredients />
//         </Suspense>
//       </ul>
//     </div>
//   );
// };

// const RecipeInstructions = ({ store }: { store: MapStore<StoreProps> }) => {
//   const NUM_INSTRUCTION_PLACEHOLDERS = 3;
//   const NUM_INSTRUCTION_TOKENS = 3;

//   const RecipeInstructionToken = ({
//     itemIndex,
//     tokenIndex,
//   }: {
//     itemIndex: number;
//     tokenIndex: number;
//   }) => {
//     const ingredientToken = waitForStoreValue(store, ({ recipe, loading }) => {
//       if (!recipe.instructions) {
//         return undefined;
//       }

//       const ingredient = recipe.instructions[itemIndex];
//       const nextInstructionExists = !!recipe.instructions[itemIndex + 1];
//       const tokens = ingredient?.split(" ") || [];
//       const nextTokenExists = tokens[tokenIndex + 1];
//       const isTrailingToken = tokenIndex >= NUM_INSTRUCTION_TOKENS - 1; // a token is trailing if its index is after the number of skeleton tokens we disploay prior to loading

//       const isLoaded =
//         (nextTokenExists && !isTrailingToken) ||
//         nextInstructionExists ||
//         !loading; // if we have any instructions it means all instructions must exists

//       if (isLoaded) {
//         let token = tokens[tokenIndex];

//         // if this is the last placeholder token
//         // grab all the reamining tokens and also display them
//         if (token && tokenIndex === NUM_INSTRUCTION_PLACEHOLDERS - 1) {
//           token = tokens.slice(tokenIndex).join(" ");
//         }

//         if (token) {
//           return token;
//         } else if (isLoaded) {
//           return null;
//         }
//       }

//       // const tokens = recipe.recipeInstructions[ingredientIndex].split(" ");
//     });
//     return <>{ingredientToken}</>;
//   };

//   const RecipeInstructionItem = ({
//     tokenIndex,
//     index,
//   }: {
//     tokenIndex: number;
//     index: number;
//   }) => {
//     return (
//       <Suspense
//         key={`item-${index}-${tokenIndex}`}
//         fallback={<Skeleton className="w-10 h-4" />}
//       >
//         <RecipeInstructionToken itemIndex={index} tokenIndex={tokenIndex} />{" "}
//       </Suspense>
//     );
//   };

//   const AdditionalInstructions = async () => {
//     // wait to recipe instructions exists, which means instructions are complete
//     await waitForStoreValue(store, (state) => !state.loading);
//     const numInstructions = await waitForStoreValue(
//       store,
//       (state) => state.recipe.instructions?.length
//     );
//     assert(
//       numInstructions,
//       "expected num instructions to be defined when showing additinal instructions. recipe process in order assumed to be incorrect"
//     );

//     const moreToShow = numInstructions - NUM_INSTRUCTION_PLACEHOLDERS;

//     return moreToShow > 0
//       ? new Array(moreToShow).fill(0).map((_, index) => {
//           const ingredientIndex = index + NUM_INSTRUCTION_PLACEHOLDERS;
//           const tokens = new Array(NUM_INSTRUCTION_TOKENS).fill(0);

//           return (
//             <li key={`ingredient-${ingredientIndex}`}>
//               {tokens.map((_, tokenIndex) => {
//                 return (
//                   <Suspense
//                     key={`token-${ingredientIndex}-${tokenIndex}`}
//                     fallback={<Skeleton className="w-10 h-4" />}
//                   >
//                     <RecipeInstructionToken
//                       itemIndex={ingredientIndex}
//                       tokenIndex={tokenIndex}
//                     />{" "}
//                   </Suspense>
//                 );
//               })}
//             </li>
//           );
//         })
//       : null;
//   };

//   const items = new Array(NUM_INSTRUCTION_PLACEHOLDERS).fill(0);
//   return (
//     <div className="mb-4 flex flex-col gap-2">
//       <ol className="pl-5 list-decimal">
//         {/* // Always show first 5 as placeholders */}

//         {items.map((_, ingredientIndex) => {
//           const tokens = new Array(NUM_INSTRUCTION_TOKENS).fill(0);

//           return (
//             <li key={`ingredient-${ingredientIndex}`}>
//               {tokens.map((_, tokenIndex) => {
//                 return (
//                   <RecipeInstructionItem
//                     key={`item-${tokenIndex}`}
//                     index={ingredientIndex}
//                     tokenIndex={tokenIndex}
//                   />
//                 );
//               })}
//             </li>
//           );
//         })}
//         <Suspense fallback={<Skeleton className="w-full h-4" />}>
//           <AdditionalInstructions />
//         </Suspense>
//       </ol>
//     </div>
//   );
// };

const getRecipe = async (slug: RecipeSlug) =>
  RecipeSchema.parse(await kv.hgetall(`recipe:${slug}`));

const SYSTEM_MESSAGE = `The original prompt to compe up with recipes ideas was: {suggestionsPrompt}
The user will provide the name and description for a recipe based on the original prompt. Please generate a full recipe for this selection following the specified format.

Format: {formatInstructions}

Here are some example outputs:

Example 1: {example1}

Example 2: {example2}

Example 3: {example3}`;

const USER_MESSAGE = `Name: {name},
    
Description: {description}`;

const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_MESSAGE],
  ["human", USER_MESSAGE],
]);

// const RecipeGenerator = async ({
//   initialRecipe,
//   store,
// }: {
//   initialRecipe: z.infer<typeof RecipeSchema>;
//   store: MapStore<StoreProps>;
// }) => {
//   const { slug, name, description } = initialRecipe;
//   const llm = new Ollama({
//     baseUrl: "http://localhost:11434",
//     model: "mistral",
//   });
//   try {
//     await kv.hget(initialRecipe.fromSuggestionsKey, "input");
//   } catch (ex) {
//     console.error(ex);
//   }
//   const rawInput = await kv.hget(initialRecipe.fromSuggestionsKey, "input");

//   const parseResult = SuggestionPredictionInputSchema.safeParse(rawInput);
//   if (!parseResult.success) {
//     return (
//       <Card>
//         <h1>Error</h1>
//         <p>Failed to get recipe</p>
//       </Card>
//     );
//   }

//   // const suggestions = SuggestionPredictionOutputSchema.parse(
//   //   await kv.hget(`${initialRecipe.fromSuggestionsKey}`, "output")
//   // );

//   const input = {
//     name,
//     description,
//     suggestionsPrompt: parseResult.data.prompt,
//     // suggestionsOutputYaml: jsYaml.dump(suggestions),
//   } satisfies RecipePredictionInput;

//   const chain = chatPrompt.pipe(llm);
//   const stream = await chain.stream({
//     ...input,
//     example1: EXAMPLE_1.output,
//     example2: EXAMPLE_2.output,
//     example3: EXAMPLE_3.output,
//     formatInstructions: FORMAT_INSTRUCTIONS,
//   });

//   await kv.hset(`recipe:${slug}`, {
//     runStatus: "receiving",
//   });

//   const charArray: string[] = [];
//   for await (const chunk of stream) {
//     charArray.push.apply(charArray, chunk.split(""));

//     try {
//       const partialResult = charArray.join("");
//       const partialYaml = jsYaml.load(sanitizeOutput(partialResult));

//       try {
//         const results =
//           RecipePredictionOutputSchema.partial().parse(partialYaml);
//         store.setKey("recipe", {
//           ...store.get().recipe,
//           ...results,
//         });
//       } catch (ex) {
//         // will occasionally fail if there is a null item or 'name' instead of 'name:'
//       }
//     } catch (ex) {
//       // console.warn(ex);
//       // no-op, expected that some will fail
//     }
//   }

//   let outputYaml: unknown;
//   const outputRaw = charArray.join("");
//   const outputSanitized = sanitizeOutput(outputRaw);
//   try {
//     outputYaml = jsYaml.load(outputSanitized);
//   } catch (ex: any) {
//     await kv.hset(`recipe:${slug}`, {
//       runStatus: "error",
//       error: ex.message,
//       outputRaw,
//       outputSanitized,
//     });
//     store.setKey("loading", false);
//     return null;
//   }

//   try {
//     const results = RecipePredictionOutputSchema.parse(outputYaml);
//     store.setKey("recipe", {
//       ...store.get().recipe,
//       ...results,
//     });

//     await kv.hset(`recipe:${slug}`, {
//       runStatus: "done",
//       ...results,
//     });
//     await kv.zadd(`recipes:new`, {
//       score: Date.now(),
//       member: slug,
//     });
//     // await multi.exec();
//   } catch (error: any) {
//     // console.error(ex);
//     // // failed to parse final result, set error
//     await kv.hset(`recipe:${slug}`, {
//       runStatus: "error",
//       error: error?.message,
//       outputRaw,
//     });
//     // shouldnt fail, if does problem with LLM response parsing, figure out how to handle
//   }
//   store.setKey("loading", false);

//   return null;
// };
