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
import { getResult } from "@/lib/db";
import { noop, waitForStoreValue } from "@/lib/utils";
import {
  CompletedRecipeSchema,
  QuestionsPredictionOutputSchema,
  RecipeSchema,
  SuggestionPredictionInputSchema,
} from "@/schema";
import { RecipePredictionInput, RecipeSlug } from "@/types";
import { kv } from "@vercel/kv";
import { ChatPromptTemplate } from "langchain/prompts";
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
import { FloatingFooter } from "@/components/ui/floating-footer";
import ClientOnly from "@/components/client-only";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ScrollLockComponent from "@/components/scroll-lock";

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
  // console.log({ recipe });
  const { runStatus } = recipe;

  const isDone = runStatus === "done";
  const isError = runStatus === "error";
  const isInitializing = runStatus === "initializing";
  console.log({ runStatus });
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
          <SousChefOutput />
          <Suspense fallback={null}>
            <WaitForRecipe>
              <SousChefPromptCommandGroup />
            </WaitForRecipe>
          </Suspense>
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

  return (
    <div className="flex flex-col gap-2 max-w-2xl mx-auto">
      <Header />
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
