import { streamToObservable } from "@/lib/stream-to-observable";
import { produce } from "immer";

import { RecipesTable, db } from "@/db";
import { NewRecipe } from "@/db/types";
import { getSlug } from "@/lib/slug";
import { assert } from "@/lib/utils";
import {
  InstantRecipeMetadataPredictionOutputSchema,
  RecipePredictionOutputSchema,
  RecipeProductsPredictionOutputSchema,
} from "@/schema";
import {
  AdContext,
  AdInstance,
  AppEvent,
  ExtractType,
  PartialRecipe,
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
import { AutoSuggestRecipesEvent } from "./auto-suggest-recipes.stream";
import { AutoSuggestTagEvent } from "./auto-suggest-tags.stream";
import { AutoSuggestTextEvent } from "./auto-suggest-text.stream";
import {
  AutoSuggestTokensEvent,
  AutoSuggestTokensEventBase,
  AutoSuggestTokensOutputSchema,
  AutoSuggestTokensStream,
} from "./auto-suggest-tokens.stream";
import {
  FullRecipeEvent,
  FullRecipeEventBase,
  FullRecipeStream,
} from "./full-recipe.stream";
import {
  InstantRecipeMetadataEvent,
  InstantRecipeMetadataEventBase,
  InstantRecipeMetadataStream,
} from "./instant-recipe/streams";
import {
  RecipeProductsEventBase,
  RecipeProductsTokenStream,
  SuggestRecipeProductsEvent,
} from "./recipe/[slug]/products/recipe-products-stream";
import { buildInput } from "./utils";

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
      numCompletedRecipeMetadata: number;
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
      | InstantRecipeMetadataEvent
      | SuggestRecipeProductsEvent
      | FullRecipeEvent
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
    // generateRecipes: fromEventObservable(
    //   ({ input }: { input: { prompt: string } }) => {
    //     const tokenStream = new AutoSuggestRecipesStream();
    //     return from(tokenStream.getStream(input)).pipe(
    //       switchMap((stream) => {
    //         return streamToObservable(
    //           stream,
    //           AutoSuggestRecipesEventBase,
    //           AutoSuggestRecipesOutputSchema
    //         );
    //       })
    //     );
    //   }
    // ),
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
    generateRecipeMetadata: fromEventObservable(
      ({
        input,
      }: {
        input: {
          prompt: string;
          tokens: string[];
          previousRejections: PartialRecipe[];
        };
      }) => {
        const tokenStream = new InstantRecipeMetadataStream();
        return from(tokenStream.getStream(input)).pipe(
          switchMap((stream) => {
            return streamToObservable(
              stream,
              InstantRecipeMetadataEventBase,
              InstantRecipeMetadataPredictionOutputSchema
            );
          })
        );
      }
    ),
    generateFullRecipe: fromEventObservable(
      ({
        input,
      }: {
        input: {
          prompt: string;
          tokens: string[];
          name: string;
          description: string;
        };
      }) => {
        const tokenStream = new FullRecipeStream();
        return from(tokenStream.getStream(input)).pipe(
          switchMap((stream) => {
            return streamToObservable(
              stream,
              FullRecipeEventBase,
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
        const nextInput = buildInput({
          prompt: event.token,
          tokens: context.tokens,
        });
        return nextInput !== context.runningInput;
        // } else if (event.type === "SET_INPUT") {
        //   return true;
      }

      if (event.type === "REMOVE_TOKEN") {
        const nextInput = buildInput({
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
    resetSuggestions: assign({
      suggestedTags: [],
      suggestedIngredients: [],
      suggestedRecipes: [],
      suggestedText: [],
      suggestedTokens: [],
      currentItemIndex: 0,
      numCompletedRecipeMetadata: 0,
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
    numCompletedRecipeMetadata: 0,
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
                    buildInput({
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
              // ".CurrentRecipe.Idle",
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
                    buildInput({
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
                  // ".CurrentRecipe.Idle",
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
                    buildInput({
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
                    buildInput({
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
                  type: "parallel",
                  states: {
                    NameAndDescription: {
                      entry: () => console.log("generaitng name and desc"),
                      initial: "Generating",
                      description:
                        "Continously generates name and description metadata for recipes up until currentItemIndex + 6",
                      states: {
                        Waiting: {
                          entry: () => console.log("enter waiting"),
                          always: {
                            target: "Generating",
                            guard: ({ context }) =>
                              context.currentItemIndex + 6 >
                              context.suggestedRecipes.length,
                          },
                        },
                        Error: {
                          entry: console.error,
                        },
                        Generating: {
                          entry: () => console.log("enter generating"),
                          on: {
                            INSTANT_RECIPE_METADATA_START: {
                              actions: assign(({ context, event }) =>
                                produce(context, (draft) => {
                                  const id = randomUUID();
                                  console.log(
                                    "METADAT START",
                                    context.suggestedRecipes.length,
                                    event
                                  );
                                  draft.suggestedRecipes.push(id);
                                  draft.recipes[id] = {};
                                })
                              ),
                            },
                            INSTANT_RECIPE_METADATA_PROGRESS: {
                              actions: [
                                assign(({ context, event }) =>
                                  produce(context, (draft) => {
                                    const currentRecipeId =
                                      context.suggestedRecipes[
                                        context.suggestedRecipes.length - 1
                                      ];
                                    assert(
                                      currentRecipeId,
                                      "expected currentRecipeId"
                                    );
                                    const recipe =
                                      draft.recipes[currentRecipeId];
                                    assert(recipe, "expected recipe");
                                    draft.recipes[currentRecipeId] = {
                                      ...recipe,
                                      ...event.data,
                                    };
                                  })
                                ),
                              ],
                            },
                            INSTANT_RECIPE_METADATA_COMPLETE: {
                              target: "Waiting",
                              actions: [
                                // todo dry: up
                                assign(({ context, event }) =>
                                  produce(context, (draft) => {
                                    console.log("COMPLETE START");
                                    const currentRecipeId =
                                      context.suggestedRecipes[
                                        context.suggestedRecipes.length - 1
                                      ];
                                    assert(
                                      currentRecipeId,
                                      "expected currentRecipeId"
                                    );
                                    const recipe =
                                      draft.recipes[currentRecipeId];
                                    assert(recipe, "expected recipe");
                                    draft.recipes[currentRecipeId] = {
                                      ...recipe,
                                      ...event.data,
                                    };
                                    console.log(
                                      "COMPLETE!",
                                      context.numCompletedRecipeMetadata
                                    );
                                    draft.numCompletedRecipeMetadata =
                                      context.numCompletedRecipeMetadata + 1;
                                  })
                                ),
                              ],
                            },
                            // AUTO_SUGGEST_RECIPES_COMPLETE: {
                            //   actions: "updateNumCompleted",
                            // },
                          },
                          invoke: {
                            onError: "Error",
                            input: ({ context, event }) => {
                              console.log("INVOKIN!!!!!", event);
                              const previousRejections =
                                context.suggestedRecipes.map(
                                  (id) => context.recipes[id]!
                                );
                              // console.log({
                              //   previousRejections,
                              //   suggestedRecipes: context.suggestedRecipes,
                              //   result: context.suggestedRecipes.map(
                              //     (id) => context.recipes[id!]
                              //   ),
                              // });
                              return {
                                prompt: context.prompt,
                                tokens: context.tokens,
                                previousRejections,
                              };
                            },
                            src: "generateRecipeMetadata",
                          },
                        },
                      },
                    },
                    FullRecipe: {
                      initial: "Waiting",
                      states: {
                        Waiting: {
                          on: {
                            INSTANT_RECIPE_METADATA_COMPLETE: {
                              target: "Generating",
                            },
                            // SKIP: {
                            //   target: "Generating",
                            // },
                          },
                        },
                        Generating: {
                          entry: assign({
                            // numCompletedRecipeMetadata: number;: ({ context }) =>
                            //   context.numCompletedRecipeMetadata: number; + 1,
                            generatingRecipeId: ({ context }) =>
                              context.suggestedRecipes[
                                context.numCompletedRecipes
                              ],
                          }),
                          invoke: {
                            onDone: [
                              {
                                target: "Generating",
                                guard: ({ context }) => {
                                  return (
                                    context.numCompletedRecipeMetadata >
                                    context.numCompletedRecipes
                                  );
                                },
                                reenter: true,
                              },
                              {
                                target: "Waiting",
                              },
                            ],
                            input: ({ context, event }) => {
                              assert(
                                context.generatingRecipeId,
                                "expected generatingRecipeId"
                              );
                              const recipe =
                                context.recipes[context.generatingRecipeId];
                              assert(recipe, "expected recipe");
                              const { name, description } = recipe;
                              assert(name, "expected name");
                              assert(description, "expected description");

                              return {
                                prompt: context.prompt,
                                tokens: context.tokens,
                                name,
                                description,
                              };
                            },
                            src: "generateFullRecipe",
                          },
                          on: {
                            FULL_RECIPE_PROGRESS: {
                              actions: assign(({ context, event }) => {
                                const { generatingRecipeId } = context;
                                assert(
                                  generatingRecipeId,
                                  "expected generatingRecipeId"
                                );
                                const recipe =
                                  context.recipes[generatingRecipeId];
                                assert(recipe, "expected recipe");
                                return produce(context, (draft) => {
                                  draft.recipes[generatingRecipeId] = {
                                    ...recipe,
                                    ...event.data.recipe,
                                  };
                                  //
                                });
                              }),
                            },
                            FULL_RECIPE_COMPLETE: {
                              actions: assign(({ context, event }) => {
                                const { generatingRecipeId } = context;
                                assert(
                                  generatingRecipeId,
                                  "expected generatingRecipeId"
                                );
                                const recipe =
                                  context.recipes[generatingRecipeId];
                                // console.log(
                                //   "COKMPELTE RECIPE",
                                //   context.numCompletedRecipes,
                                //   context.numCompletedRecipeMetadata
                                // );
                                return produce(context, (draft) => {
                                  assert(recipe, "expected recipe");
                                  draft.recipes[generatingRecipeId] = {
                                    ...recipe,
                                    ...event.data.recipe,
                                  };
                                  draft.numCompletedRecipes++;
                                });
                              }),
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

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
