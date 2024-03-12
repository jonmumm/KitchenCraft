import { streamToObservable } from "@/lib/stream-to-observable";
import { produce } from "immer";

import { RecipesTable, db } from "@/db";
import { NewRecipe } from "@/db/types";
import { getSlug } from "@/lib/slug";
import { assert } from "@/lib/utils";
import {
  RecipePredictionOutputSchema,
  RecipeProductsPredictionOutputSchema,
} from "@/schema";
import {
  AdContext,
  AffiliateProduct,
  AppEvent,
  ExtractType,
  ProductType,
  WithCaller,
} from "@/types";
import { nanoid } from "ai";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import type * as Party from "partykit/server";
import { from, map, mergeMap, switchMap } from "rxjs";
import {
  assign,
  fromEventObservable,
  fromPromise,
  setup,
  spawnChild,
} from "xstate";
import { z } from "zod";
import { AutoSuggestIngredientEvent } from "./auto-suggest-ingredients.stream";
import {
  AutoSuggestPlaceholderEvent,
  AutoSuggestPlaceholderOutputSchema,
  AutoSuggestPlaceholderStream,
} from "./auto-suggest-placeholder.stream";
import {
  AutoSuggestRecipesEvent,
  AutoSuggestRecipesEventBase,
  AutoSuggestRecipesOutputSchema,
  AutoSuggestRecipesStream,
} from "./auto-suggest-recipes.stream";
import { AutoSuggestTagEvent } from "./auto-suggest-tags.stream";
import { AutoSuggestTextEvent } from "./auto-suggest-text.stream";
import {
  AutoSuggestTokensEvent,
  AutoSuggestTokensEventBase,
  AutoSuggestTokensOutputSchema,
  AutoSuggestTokensStream,
} from "./auto-suggest-tokens.stream";
import { NewRecipeEvent, NewRecipeStream } from "./new-recipe.stream";
import {
  RecipeProductsEventBase,
  RecipeProductsTokenStream,
  SuggestRecipeProductsEvent,
} from "./recipe/[slug]/products/recipe-products-stream";

// const autoSuggestionOutputSchemas = {
//   tags: InstantRecipeMetadataPredictionOutputSchema,
//   ingredients: InstantRecipeMetadataPredictionOutputSchema,
//   recipes: SuggestionPredictionOutputSchema,
// };

type NewRecipeProductKeywordEvent = {
  type: "NEW_RECIPE_PRODUCT_KEYWORD";
  keyword: string;
  productType: ProductType;
  slug: string;
};

const InputSchema = z.object({
  id: z.string(),
  storage: z.custom<Party.Storage>(),
});
type Input = z.infer<typeof InputSchema>;

// type AutoSuggestRecipeEvent = StreamObservableEvent<
//   "RECIPE",
//   z.infer<typeof autoSuggestIngredientsOutputSchema>
// >;

type PartialRecipe = {
  name?: string;
  description?: string;
  tags?: string[];
  yield?: string;
  ingredients?: string[];
  instructions?: string[];
  cookTime?: string;
  totalTime?: string;
  activeTime?: string;
};

type AdInstance = {
  id: string;
  context: AdContext;
  product?: AffiliateProduct;
};

// const adTargetingMachine = setup({}).createMachine({id: "AdTargetingMachine",
// states:{

// }})

export const sessionMachine = setup({
  types: {
    input: {} as Input,
    context: {} as {
      distinctId: string;
      createdRecipeSlugs: string[];
      createdBy?: string;
      prompt: string;
      runningInput: string | undefined;
      storage: Party.Storage;
      tokens: string[];
      suggestedRecipes: string[];
      recipes: Record<string, PartialRecipe>;
      generatingRecipeId: string | undefined;
      currentItemIndex: number;
      numCompletedRecipes: number;
      numStartedRecipes: number;
      suggestedTags: string[];
      suggestedText: string[];
      suggestedTokens: string[];
      placeholders: string[];
      suggestedIngredients: string[];
      adInstances: Record<string, AdInstance>;
      viewedAdInstanceIds: string[];
      clickedAdInstanceIds: string[];
      productIdViewCounts: Record<string, number>;
    },
    events: {} as
      | WithCaller<AppEvent>
      | AutoSuggestTagEvent
      | AutoSuggestIngredientEvent
      | AutoSuggestRecipesEvent
      | AutoSuggestTextEvent
      | AutoSuggestTokensEvent
      | AutoSuggestPlaceholderEvent
      | SuggestRecipeProductsEvent
      | NewRecipeEvent
      | NewRecipeProductKeywordEvent,
  },
  actors: {
    createNewRecipe: fromPromise(
      async ({
        input,
      }: {
        input: {
          recipe: PartialRecipe;
          prompt: string;
          tokens: string[];
          createdBy: string;
        };
      }) => {
        const id = nanoid();
        const { recipe } = input;

        assert(recipe.name, "expected name");
        const slug = getSlug({ id, name: recipe.name });
        assert(recipe.description, "expected description");

        const finalRecipe = {
          id: randomUUID(),
          slug,
          versionId: 0,
          description: recipe.description,
          name: recipe.name,
          yield: recipe.yield!,
          tags: recipe.tags!,
          ingredients: recipe.ingredients!,
          instructions: recipe.instructions!,
          cookTime: recipe.cookTime!,
          tokens: input.tokens,
          activeTime: recipe.activeTime!,
          totalTime: recipe.totalTime!,
          prompt: input.prompt,
          createdBy: input.createdBy,
          createdAt: new Date(),
        } satisfies NewRecipe;

        await db.insert(RecipesTable).values(finalRecipe);
        return slug;
      }
    ),
    generateRecipes: fromEventObservable(
      ({ input }: { input: { prompt: string } }) => {
        const tokenStream = new AutoSuggestRecipesStream();
        return from(tokenStream.getStream(input)).pipe(
          switchMap((stream) => {
            return streamToObservable(
              stream,
              AutoSuggestRecipesEventBase,
              AutoSuggestRecipesOutputSchema
            );
          })
        );
      }
    ),
    generatePlaceholders: fromEventObservable(
      ({ input }: { input: { prompt: string } }) => {
        const tokenStream = new AutoSuggestPlaceholderStream();
        return from(tokenStream.getStream(input)).pipe(
          switchMap((stream) => {
            return streamToObservable(
              stream,
              "PLACEHOLDER",
              AutoSuggestPlaceholderOutputSchema
            );
          })
        );
      }
    ),
    generateRecipe: fromEventObservable(
      ({
        input,
      }: {
        input: {
          name: string;
          description: string;
          prompt: string;
        };
      }) => {
        const tokenStream = new NewRecipeStream();
        return from(tokenStream.getStream(input)).pipe(
          switchMap((stream) => {
            return streamToObservable(
              stream,
              "NEW_RECIPE",
              RecipePredictionOutputSchema
            );
          })
        );
      }
    ),
    generateTokens: fromEventObservable(
      ({ input }: { input: { prompt: string } }) => {
        const tokenStream = new AutoSuggestTokensStream();
        return from(tokenStream.getStream(input)).pipe(
          switchMap((stream) => {
            return streamToObservable(
              stream,
              AutoSuggestTokensEventBase,
              AutoSuggestTokensOutputSchema
            );
          })
        );
      }
    ),
    initializeRecipeAds: fromEventObservable(
      ({ input }: { input: { context: ExtractType<AdContext, "recipe"> } }) => {
        const getRecipes = db
          .select()
          .from(RecipesTable)
          .where(eq(RecipesTable.slug, input.context.slug))
          .execute();
        const lastKeywords = new Set();

        return from(getRecipes).pipe(
          map((recipes) => {
            const recipe = recipes[0];
            assert(recipe, "expected recipe");
            console.log(recipe);
            return recipe;
          }),
          switchMap(async (recipe) => {
            const tokenStream = new RecipeProductsTokenStream();
            return await tokenStream.getStream({
              type: input.context.productType,
              recipe,
            });
          }),
          switchMap((stream) => {
            console.log("starting stream");
            return streamToObservable(
              stream,
              RecipeProductsEventBase,
              RecipeProductsPredictionOutputSchema
            );
          }),
          mergeMap((event) => {
            if (
              event.type === "SUGGEST_RECIPE_PRODUCTS_PROGRESS" &&
              Array.isArray(event.data.queries)
            ) {
              const newKeywords = event.data.queries.filter(
                (keyword) => !lastKeywords.has(keyword)
              );
              newKeywords.forEach((keyword) => lastKeywords.add(keyword)); // Update state

              // // Map new keywords to events and emit them immediately
              return newKeywords.map((keyword) => ({
                type: "NEW_RECIPE_PRODUCT_KEYWORD",
                keyword: keyword,
                productType: input.context.productType,
                slug: input.context.slug,
              }));
            } else if (event.type === "SUGGEST_RECIPE_PRODUCTS_COMPLETE") {
              // Handle completion if needed. For now, return an empty array to emit nothing.
              return [];
            }
            // Return an empty array for any other event types to emit nothing.
            return [];
          })
        );
      }
    ),
  },
  guards: {
    shouldCreateNewAds: ({ context }) => {
      Object.values(context.adInstances).map((item) => item.product);
      return false;
    },
    shouldRunInput: ({ context, event }) => {
      if (event.type === "ADD_TOKEN") {
        const nextInput = buildSuggestionsInput({
          prompt: event.token,
          tokens: context.tokens,
        });
        return nextInput !== context.runningInput;
        // } else if (event.type === "SET_INPUT") {
        //   return true;
      }

      if (event.type === "REMOVE_TOKEN") {
        const nextInput = buildSuggestionsInput({
          prompt: event.token,
          tokens: context.tokens.filter((token) => token !== event.token),
        });
        return !!nextInput.length;
      }

      if (event.type === "NEW_RECIPE") {
        return !!event.prompt?.length || !!event.tokens?.length;
      }

      assert(false, "unhandled event type: " + event.type);
    },
  },
  actions: {
    updateNumCompleted: assign(({ context, event }) => {
      return produce(context, (draft) => {
        if (event.type === "AUTO_SUGGEST_RECIPES_PROGRESS") {
          const batchCompleteCount = event.data.recipes?.length
            ? event.data.recipes.length - 1
            : 0;
          const incompleteCount =
            context.numStartedRecipes -
            batchCompleteCount -
            (context.numStartedRecipes - 6);

          draft.numCompletedRecipes =
            context.numStartedRecipes - incompleteCount;
          // context.numCompletedRecipes =
          //   context.numStartedRecipes - incompleteCount;
          // if (batchRecipeStartedCount && incompleteCount) {
          //   // const originalNumCompletedRecipes =
          //   //   context.numStartedRecipes -
          //   //   (context.numStartedRecipes - context.numCompletedRecipes);
          //   context.numCompletedRecipes =
          //     context.numStartedRecipes - incompleteCount;
          // }
        } else if (event.type === "AUTO_SUGGEST_RECIPES_COMPLETE") {
          context.numCompletedRecipes = context.numStartedRecipes;
        } else {
          console.warn("Unexpected event type", event);
        }

        // if (context.numCompletedRecipes < context.numStartedRecipes - ) {
        // }
        // const numStartedRecipes = event.data.recipes?.length || 0;
        // if (numStartedRecipes - 1 >= context.numStartedRecipes) {
        //   context.numStartedRecipes;
        // }
        // draft.numCompletedRecipes += 6;
      });
    }),
    resetSuggestions: assign({
      suggestedTags: [],
      suggestedIngredients: [],
      suggestedRecipes: [],
      suggestedText: [],
      suggestedTokens: [],
      currentItemIndex: 0,
      numStartedRecipes: 0,
      numCompletedRecipes: 0,
    }),
  },
}).createMachine({
  id: "UserAppMachine",
  context: ({ input }) => ({
    distinctId: input.id,
    prompt: "",
    storage: input.storage,
    currentItemIndex: 0,
    numCompletedRecipes: 0,
    numStartedRecipes: 0,
    tokens: [],
    runningInput: undefined,
    recipes: {},
    suggestedRecipes: [],
    generatingRecipeId: undefined,
    suggestedTags: [],
    suggestedText: [],
    suggestedIngredients: [],
    suggestedTokens: [],
    createdRecipeSlugs: [],
    placeholders: defaultPlaceholders,
    adInstances: {},
    viewedAdInstanceIds: [],
    clickedAdInstanceIds: [],
    productIdViewCounts: {},
  }),
  type: "parallel",
  states: {
    Ads: {
      type: "parallel",
      states: {
        Pipeline: {
          on: {
            NEW_RECIPE_PRODUCT_KEYWORD: {
              actions: assign(({ context, event }) => {
                console.log(event.keyword);
                return {};
              }),
            },
          },
        },
        Instances: {
          on: {
            INIT_AD_INSTANCES: {
              actions: assign(({ context, event }) =>
                produce(context, (draft) => {
                  event.ids.forEach((id) => {
                    draft.adInstances[id] = {
                      id,
                      context: event.context,
                    };
                  });
                })
              ),
            },
            PRESS_AD_INSTANCE: {
              actions: assign({
                viewedAdInstanceIds: ({ context, event }) => [
                  ...context.viewedAdInstanceIds,
                  event.adInstanceId,
                ],
              }),
            },
            VIEW_AD_INSTANCE: {
              actions: assign({
                viewedAdInstanceIds: ({ context, event }) => [
                  ...context.viewedAdInstanceIds,
                  event.adInstanceId,
                ],
              }),
            },
          },
        },
        Initialization: {
          initial: "Idle",
          states: {
            Idle: {
              on: {
                INIT_AD_INSTANCES: [
                  {
                    guard: ({ event }) => event.context.type === "recipe",
                    actions: spawnChild("initializeRecipeAds", {
                      input: ({ context, event }) => {
                        assert(
                          event.type === "INIT_AD_INSTANCES",
                          "expected event INIT_AD_INSTANCES"
                        );
                        assert(
                          event.context.type === "recipe",
                          "expected recipe context"
                        );

                        return {
                          ids: event.ids,
                          context: event.context,
                          productIdViewCounts: context.productIdViewCounts,
                        };
                      },
                    }),
                  },
                ],
                // target:"Initializing",
              },
            },
            // Initializing: {
            //   invoke: {
            //     onDone: {
            //       target: "Idle",
            //       actions: assign(({ event, context }) =>
            //         produce(context, (draft) => {
            //           console.log(event);
            //           // draft.adInstances
            //         })
            //       ),
            //     },
            //     input: () => ({ adIds: [] }),
            //     src: "initializeAds",
            //   },
            // },
          },
        },
      },
    },

    Craft: {
      type: "parallel",
      states: {
        Input: {
          on: {
            SKIP: {
              actions: assign({
                currentItemIndex: ({ context }) => context.currentItemIndex + 1,
              }),
            },
            CLEAR: [
              {
                guard: ({ event }) => !!event.all,
                actions: [
                  "resetSuggestions",
                  assign({
                    prompt: "",
                    tokens: [],
                    runningInput: undefined,
                  }),
                ],
              },
              {
                actions: [
                  "resetSuggestions",
                  assign({
                    prompt: "",
                    runningInput: undefined,
                  }),
                ],
              },
            ],
            NEW_RECIPE: {
              actions: [
                "resetSuggestions",
                assign({
                  tokens: ({ event }) => event.tokens || [],
                  prompt: ({ event }) => event.prompt || "",
                }),
              ],
            },
            REMOVE_TOKEN: {
              actions: [
                "resetSuggestions",
                assign({
                  tokens: ({ context, event }) =>
                    context.tokens.filter((token) => token !== event.token),
                }),
              ],
            },
            ADD_TOKEN: {
              actions: [
                assign({
                  tokens: ({ context, event }) => [
                    ...context.tokens,
                    event.token,
                  ],
                }),
              ],
            },
            SET_INPUT: {
              actions: [
                "resetSuggestions",
                assign({
                  prompt: ({ event }) => event.value,
                  runningInput: ({ event, context }) =>
                    buildSuggestionsInput({
                      prompt: event.value,
                      tokens: context.tokens,
                    }),
                }),
              ],
            },
          },
        },

        Generators: {
          type: "parallel",
          on: {
            CLEAR: [
              ".Placeholder.Idle",
              ".Tokens.Idle",
              ".Recipes.Idle",
              ".CurrentRecipe.Idle",
            ],
            REMOVE_TOKEN: [
              {
                target: [
                  ".Placeholder.Generating",
                  ".Tokens.Generating",
                  ".Recipes.Generating",
                ],
                actions: assign({
                  runningInput: ({ context, event }) =>
                    buildSuggestionsInput({
                      prompt: context.prompt,
                      tokens: context.tokens.filter(
                        (token) => token !== event.token
                      ),
                    }),
                }),
                guard: "shouldRunInput",
              },
              {
                target: [
                  ".Placeholder.Idle",
                  ".Tokens.Idle",
                  ".Recipes.Idle",
                  ".CurrentRecipe.Idle",
                ],
                actions: assign({
                  runningInput: undefined,
                }),
              },
            ],
            NEW_RECIPE: {
              target: [
                ".Placeholder.Generating",
                ".Tokens.Generating",
                ".Recipes.Generating",
              ],
              actions: [
                "resetSuggestions",
                assign({
                  runningInput: ({ context, event }) =>
                    buildSuggestionsInput({
                      prompt: context.prompt,
                      tokens: context.tokens,
                    }),
                }),
              ],
              guard: "shouldRunInput",
            },
            ADD_TOKEN: {
              target: [
                ".Placeholder.Generating",
                ".Tokens.Generating",
                ".Recipes.Generating",
              ],
              actions: [
                "resetSuggestions",
                assign({
                  runningInput: ({ context, event }) =>
                    buildSuggestionsInput({
                      prompt: context.prompt,
                      tokens: context.tokens,
                    }),
                }),
              ],
              guard: "shouldRunInput",
            },
            SET_INPUT: [
              {
                target: [
                  ".Placeholder.Holding",
                  ".Tokens.Holding",
                  ".Recipes.Holding",
                ],
                guard: ({ event }) => !!event.value?.length,
              },
              {
                target: [".Placeholder.Idle", ".Tokens.Idle", ".Recipes.Idle"],
              },
            ],
          },
          states: {
            Placeholder: {
              initial: "Idle",
              states: {
                Idle: {},
                Holding: {
                  after: {
                    300: {
                      target: "Generating",
                      guard: ({ context }) => !!context.prompt?.length,
                    },
                  },
                },
                Generating: {
                  on: {
                    // TAG_START: {
                    //   actions: assign({
                    //     suggestedTagsResultId: ({ event }) => event.resultId,
                    //   }),
                    // },
                    PLACEHOLDER_PROGRESS: {
                      actions: assign({
                        placeholders: ({ event }) => event.data.items || [],
                      }),
                    },
                    PLACEHOLDER_COMPLETE: {
                      actions: assign({
                        placeholders: ({ event }) => event.data.items,
                      }),
                    },
                  },
                  invoke: {
                    input: ({ context }) => ({
                      prompt: context.prompt.length
                        ? context.prompt
                        : context.runningInput!,
                    }),
                    src: "generatePlaceholders",
                    onDone: {
                      target: "Idle",
                    },
                  },
                },
              },
            },
            Tokens: {
              initial: "Idle",
              states: {
                Idle: {},
                Holding: {
                  after: {
                    500: {
                      target: "Generating",
                      guard: ({ context }) => !!context.prompt?.length,
                    },
                  },
                },
                Generating: {
                  on: {
                    AUTO_SUGGEST_TOKENS_PROGRESS: {
                      actions: assign({
                        suggestedTokens: ({ event }) => event.data.tokens || [],
                      }),
                    },
                    AUTO_SUGGEST_TOKENS_COMPLETE: {
                      actions: assign({
                        suggestedTokens: ({ event }) => event.data.tokens,
                      }),
                    },
                  },
                  invoke: {
                    input: ({ context }) => ({
                      prompt: context.runningInput!,
                    }),
                    src: "generateTokens",
                    onDone: {
                      target: "Idle",
                    },
                  },
                },
              },
            },
            Recipes: {
              initial: "Idle",
              states: {
                Idle: {
                  always: {
                    target: "Generating",
                    guard: ({ context, event }) => {
                      if (context.numCompletedRecipes >= 6) {
                        return (
                          context.currentItemIndex + 5 >=
                          context.numCompletedRecipes
                        );
                      }
                      return false;
                    },
                  },
                },
                Holding: {
                  after: {
                    500: {
                      target: "Generating",
                      guard: ({ context }) => !!context.prompt?.length,
                    },
                  },
                },
                Generating: {
                  on: {
                    AUTO_SUGGEST_RECIPES_START: {
                      actions: [
                        assign({
                          numStartedRecipes: ({ context }) =>
                            context.numStartedRecipes + 6,
                        }),
                      ],
                    },
                    AUTO_SUGGEST_RECIPES_PROGRESS: {
                      actions: [
                        "updateNumCompleted",
                        assign(({ context, event }) =>
                          produce(context, (draft) => {
                            if (!event.data.recipes) {
                              return;
                            }

                            for (let i = 6; i >= 0; i--) {
                              const index = context.numStartedRecipes - i;
                              const recipe = event.data.recipes[6 - i];
                              if (!recipe) {
                                continue;
                              }

                              let recipeId = context.suggestedRecipes[index];
                              if (!recipeId) {
                                recipeId = nanoid();
                                draft.suggestedRecipes[index] = recipeId;
                              }

                              draft.recipes[recipeId] ||= {};
                              draft.recipes[recipeId]!.name = recipe.name;
                              draft.recipes[recipeId]!.description =
                                recipe.description;
                            }
                          })
                        ),
                      ],
                    },
                    AUTO_SUGGEST_RECIPES_COMPLETE: {
                      actions: "updateNumCompleted",
                    },
                  },
                  invoke: {
                    input: ({ context }) => ({
                      prompt: context.runningInput!,
                    }),
                    src: "generateRecipes",
                    onError: {
                      actions: (f) => {
                        console.log(f);
                      },
                    },
                    onDone: {
                      target: "Idle",
                    },
                  },
                },
              },
            },

            CurrentRecipe: {
              initial: "Idle",
              on: {
                SKIP: ".Generating",
              },
              states: {
                Idle: {
                  always: {
                    target: "Generating",
                    guard: ({ context, event }) => {
                      const recipeId =
                        context.suggestedRecipes[context.currentItemIndex];

                      if (recipeId) {
                        const numInstructions =
                          context.recipes[recipeId]?.instructions?.length;
                        return (
                          !!context.numCompletedRecipes && !numInstructions
                        );
                      }
                      return false;
                    },
                  },
                },
                Generating: {
                  on: {
                    NEW_RECIPE_PROGRESS: {
                      actions: [
                        assign(({ context, event }) =>
                          produce(context, (draft) => {
                            const currentRecipeId =
                              draft.suggestedRecipes[draft.currentItemIndex];
                            assert(currentRecipeId, "expected currentRecipeId");
                            let recipe = draft.recipes[currentRecipeId];
                            assert(recipe, "expected currentRecipe");

                            draft.recipes[currentRecipeId] = {
                              ...recipe,
                              ...event.data.recipe,
                            };
                          })
                        ),
                      ],
                    },
                    NEW_RECIPE_COMPLETE: {},
                  },
                  invoke: {
                    input: ({ context }) => {
                      const currentRecipeId =
                        context.suggestedRecipes[context.currentItemIndex];
                      assert(currentRecipeId, "expected currentRecipeId");
                      const recipe = context.recipes[currentRecipeId];
                      assert(recipe, "expected currentRecipe");
                      return {
                        prompt: context.runningInput!,
                        name: recipe.name!,
                        description: recipe.description!,
                      };
                    },
                    src: "generateRecipe",
                    onError: {
                      actions: (f) => {
                        console.log(f);
                      },
                    },
                    onDone: {
                      target: "Idle",
                    },
                  },
                },
              },
            },
          },
        },

        NewRecipe: {
          initial: "Idle",
          states: {
            Idle: {
              on: {
                SAVE: {
                  target: "Creating",
                  actions: assign({
                    createdBy: ({ event }) => {
                      return event.caller.id;
                    },
                  }),
                },
              },
            },
            Error: {
              entry: ({ event }) => {
                console.log(event);
              },
            },
            Creating: {
              invoke: {
                onDone: {
                  target: "Idle",
                  actions: assign(({ context, event }) => {
                    return produce(context, (draft) => {
                      draft.createdRecipeSlugs.push(event.output);
                    });
                  }),
                },
                onError: "Error",
                input: ({ context }) => {
                  const currentRecipeId =
                    context.suggestedRecipes[context.currentItemIndex];
                  assert(currentRecipeId, "expected currentRecipeId");
                  let recipe = context.recipes[currentRecipeId];
                  assert(recipe, "expected currentRecipe");
                  assert(context.createdBy, "expected createdBy when savings");
                  return {
                    recipe,
                    prompt: context.prompt,
                    tokens: context.tokens,
                    createdBy: context.createdBy,
                  };
                },
                src: "createNewRecipe",
              },
            },
          },
        },
      },
    },
  },
});

const buildSuggestionsInput = ({
  prompt,
  tokens,
}: {
  prompt: string;
  tokens: string[];
}) => {
  return prompt.length ? prompt + ", " + tokens.join(", ") : tokens.join(", ");
};

const defaultPlaceholders = [
  "3 eggs",
  "1lb ground beef",
  "2 cups flour",
  "pad thai",
  "curry dish",
  "pasta meal",
  "chicken stew",
  "veggie mix",
  "family meal",
  "6 servings",
  "party size",
  "omelette",
  "pancakes",
  "salad lunch",
  "fruit snack",
  "steak dinner",
  "cook tonight",
  "quick stir-fry",
  "protein-rich",
  "low-cal meal",
  "heart healthy",
  "keto snack",
  "no nuts",
  "dairy-free",
  "gluten-free",
  "lactose-free",
  "bake bread",
  "slow cooker",
  "grilled fish",
  "smoked ribs",
  "kid-friendly",
  "easy recipe",
  "superfoods",
  "without sugar",
  "whole grain",
  "roast veggies",
  "grill bbq",
];

// const getGoogleResultsForAffiliateProducts = async (keyword: string) => {
//   let query: string;
//   switch (type) {
//     case "book":
//       query = `book ${keyword}`;
//       break;
//     case "equipment":
//       query = `kitchen ${keyword}`;
//       break;
//     default:
//       query = keyword;
//   }

//   const googleSearchResponse = await fetch(
//     `https://www.googleapis.com/customsearch/v1?key=${
//       privateEnv.GOOGLE_CUSTOM_SEARCH_API_KEY
//     }&cx=${privateEnv.GOOGLE_CUSTOM_SEARCH_ENGINE_ID}&q=${encodeURIComponent(
//       query
//     )}`
//   );

//   const result = await googleSearchResponse.json();
//   return result;
// };
