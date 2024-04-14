import { streamToObservable } from "@/lib/stream-to-observable";
import { produce } from "immer";

import { ListRecipeTable, ListTable, RecipesTable, db } from "@/db";
// import { createListRecipe, ensureMyRecipesList } from "@/db/queries";
import { NewRecipe } from "@/db/types";
import { getErrorMessage } from "@/lib/error";
import { withDatabaseSpan } from "@/lib/observability";
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
  Caller,
  DbOrTransaction,
  ExtractType,
  PartialRecipe,
  ProductType,
  WithCaller,
} from "@/types";
import { randomUUID } from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { Operation, applyPatch, compare } from "fast-json-patch";
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
import { buildInput, generateUrlSafeHash } from "./utils";

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
  url: z.string().url(),
  initialCaller: z.custom<Caller>(),
});
type Input = z.infer<typeof InputSchema>;

// type AutoSuggestRecipeEvent = StreamObservableEvent<
//   "RECIPE",
//   z.infer<typeof autoSuggestIngredientsOutputSchema>
// >;

// const adTargetingMachine = setup({}).createMachine({id: "AdTargetingMachine",
// states:{

// }})

type Context = {
  distinctId: string;
  // createdRecipeSlugs: string[];
  initialCaller: Caller;
  createdBy?: string;
  prompt: string;
  inputHash: string | undefined;
  storage: Party.Storage;
  tokens: string[];
  suggestedRecipes: string[];
  recipes: Record<string, PartialRecipe & { complete: boolean }>;
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
  undoOperations: Operation[][];
  redoOperations: Operation[][];
  history: string[];
};

export const pageSessionMachine = setup({
  types: {
    input: {} as Input,
    context: {} as Context,
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
    saveRecipeToList: fromPromise(
      async ({
        input,
      }: {
        input: {
          recipeId: string;
          userId: string;
        };
      }) => {
        const result = await ensureMyRecipesList(db, input.userId);
        assert(result.success, "expected to get listId");

        await createListRecipe(db, input.userId, input.recipeId, result.listId);
        return "";
      }
    ),
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
        const { recipe } = input;

        assert(recipe.name, "expected name");
        assert(recipe.description, "expected description");
        assert(recipe.slug, "expected slug");

        const finalRecipe = {
          id: recipe.id,
          slug: recipe.slug,
          versionId: recipe.versionId,
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
        return recipe.slug;
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
              const newKeywords = event.data.queries
                .slice(0, event.data.queries.length - 1)
                .filter((keyword) => !lastKeywords.has(keyword));
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
        const hash = generateUrlSafeHash(
          buildInput({
            prompt: event.token,
            tokens: context.tokens,
          })
        );
        return hash !== context.inputHash;
        // } else if (event.type === "SET_INPUT") {
        //   return true;
      }

      if (event.type === "UNDO") {
        const hash = generateUrlSafeHash(
          buildInput({
            prompt: context.prompt,
            tokens: context.tokens,
          })
        );

        const patch = context.undoOperations[context.undoOperations.length - 1];
        assert(patch, "expected patch");
        const nextContext = produce(context, (draft) => {
          applyPatch(draft, patch);
        });

        const nextHash = generateUrlSafeHash(buildInput(nextContext));
        const nextInput = buildInput(nextContext);

        return !!nextInput.length && hash !== nextHash;
      }

      if (event.type === "REMOVE_TOKEN") {
        const input = buildInput({
          prompt: event.token,
          tokens: context.tokens.filter((token) => token !== event.token),
        });
        return !!input.length;
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
    history: [input.url],
    prompt: "",
    initialCaller: input.initialCaller,
    storage: input.storage,
    currentItemIndex: 0,
    numCompletedRecipes: 0,
    numCompletedRecipeMetadata: 0,
    tokens: [],
    inputHash: undefined,
    recipes: {},
    suggestedRecipes: [],
    generatingRecipeId: undefined,
    suggestedTags: [],
    suggestedText: [],
    suggestedIngredients: [],
    suggestedTokens: [],
    // createdRecipeSlugs: [],
    placeholders: defaultPlaceholders,
    adInstances: {},
    viewedAdInstanceIds: [],
    clickedAdInstanceIds: [],
    productIdViewCounts: {},
    undoOperations: [],
    redoOperations: [],
  }),
  type: "parallel",
  states: {
    // Ads: {
    //   type: "parallel",
    //   states: {
    //     Pipeline: {
    //       on: {
    //         NEW_RECIPE_PRODUCT_KEYWORD: {
    //           actions: assign(({ context, event }) => {
    //             console.log(event.keyword);
    //             return {};
    //           }),
    //         },
    //       },
    //     },
    //     Instances: {
    //       on: {
    //         INIT_AD_INSTANCES: {
    //           actions: assign(({ context, event }) =>
    //             produce(context, (draft) => {
    //               event.ids.forEach((id) => {
    //                 draft.adInstances[id] = {
    //                   id,
    //                   context: event.context,
    //                 };
    //               });
    //             })
    //           ),
    //         },
    //         PRESS_AD_INSTANCE: {
    //           actions: assign({
    //             viewedAdInstanceIds: ({ context, event }) => [
    //               ...context.viewedAdInstanceIds,
    //               event.adInstanceId,
    //             ],
    //           }),
    //         },
    //         VIEW_AD_INSTANCE: {
    //           actions: assign({
    //             viewedAdInstanceIds: ({ context, event }) => [
    //               ...context.viewedAdInstanceIds,
    //               event.adInstanceId,
    //             ],
    //           }),
    //         },
    //       },
    //     },
    //     Initialization: {
    //       initial: "Idle",
    //       states: {
    //         Idle: {
    //           on: {
    //             INIT_AD_INSTANCES: [
    //               {
    //                 guard: ({ event }) => event.context.type === "recipe",
    //                 actions: spawnChild("initializeRecipeAds", {
    //                   input: ({ context, event }) => {
    //                     assert(
    //                       event.type === "INIT_AD_INSTANCES",
    //                       "expected event INIT_AD_INSTANCES"
    //                     );
    //                     assert(
    //                       event.context.type === "recipe",
    //                       "expected recipe context"
    //                     );

    //                     return {
    //                       ids: event.ids,
    //                       context: event.context,
    //                       productIdViewCounts: context.productIdViewCounts,
    //                     };
    //                   },
    //                 }),
    //               },
    //             ],
    //           },
    //         },
    //       },
    //     },
    //   },
    // },

    Craft: {
      type: "parallel",
      states: {
        Input: {
          on: {
            PREV: {
              actions: assign(({ context }) => {
                return produce(context, (draft) => {
                  assert(
                    context.currentItemIndex > 0,
                    "expected non 0 currentItemIndex"
                  );
                  draft.currentItemIndex = draft.currentItemIndex - 1;
                });
              }),
            },
            SCROLL_INDEX: {
              actions: assign({
                currentItemIndex: ({ event }) => event.index,
              }),
            },
            NEXT: {
              actions: assign({
                currentItemIndex: ({ context }) => context.currentItemIndex + 1,
                // undoOperations: ({ context, event }) => [
                //   ...context.undoOperations,
                //   compare(
                //     {
                //       prompt: context.prompt,
                //       tokens: context.tokens,
                //       currentItemIndex: context.currentItemIndex + 1,
                //     },
                //     {
                //       prompt: context.prompt,
                //       tokens: context.tokens,
                //       currentItemIndex: context.currentItemIndex,
                //     }
                //   ),
                // ],
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
                    inputHash: undefined,
                    undoOperations: ({ context, event }) => [
                      ...context.undoOperations,
                      compare(
                        {
                          prompt: "",
                          tokens: [],
                          currentItemIndex: context.currentItemIndex,
                        },
                        {
                          prompt: context.prompt,
                          tokens: context.tokens,
                          currentItemIndex: context.currentItemIndex,
                        }
                      ),
                    ],
                  }),
                ],
              },
              {
                actions: [
                  "resetSuggestions",
                  assign({
                    prompt: "",
                    inputHash: undefined,
                    undoOperations: ({ context, event }) => [
                      ...context.undoOperations,
                      compare(
                        {
                          prompt: "",
                          tokens: context.tokens,
                          currentItemIndex: context.currentItemIndex,
                        },
                        {
                          prompt: context.prompt,
                          tokens: context.tokens,
                          currentItemIndex: context.currentItemIndex,
                        }
                      ),
                    ],
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
                  currentItemIndex: 0,
                }),
              ],
            },
            REMOVE_TOKEN: {
              actions: [
                "resetSuggestions",
                assign({
                  tokens: ({ context, event }) =>
                    context.tokens.filter((token) => token !== event.token),
                  undoOperations: ({ context, event }) => [
                    ...context.undoOperations,
                    compare(
                      {
                        prompt: context.prompt,
                        tokens: context.tokens.filter(
                          (token) => token !== event.token
                        ),
                        currentItemIndex: context.currentItemIndex,
                      },
                      {
                        prompt: context.prompt,
                        tokens: context.tokens,
                        currentItemIndex: context.currentItemIndex,
                      }
                    ),
                  ],
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
                  undoOperations: ({ context, event }) => [
                    ...context.undoOperations,
                    compare(
                      {
                        prompt: context.prompt,
                        tokens: [...context.tokens, event.token],
                        currentItemIndex: context.currentItemIndex,
                      },
                      {
                        prompt: context.prompt,
                        tokens: context.tokens,
                        currentItemIndex: context.currentItemIndex,
                      }
                    ),
                  ],
                }),
              ],
            },
            SET_INPUT: {
              actions: [
                "resetSuggestions",
                assign({
                  prompt: ({ event }) => event.value,
                  inputHash: ({ event, context }) =>
                    generateUrlSafeHash(
                      buildInput({
                        prompt: event.value,
                        tokens: context.tokens,
                      })
                    ),
                }),
              ],
            },
          },
        },

        Saving: {
          on: {
            SAVE: {
              guard: ({ event }) => event.caller.type === "user",
              actions: spawnChild("saveRecipeToList", {
                input: ({ context, event }) => {
                  assert("caller" in event, "expected caller");
                  assert(
                    event.caller.type === "user",
                    "expected caller to be user"
                  );
                  const userId = event.caller.id;

                  const recipeId =
                    context.suggestedRecipes[context.currentItemIndex];
                  assert(recipeId, "expected recipeId");

                  return {
                    recipeId,
                    userId,
                  };
                },
              }),
            },
          },
        },

        // NewRecipe: {
        //   initial: "Idle",
        //   states: {
        //     Idle: {
        //       on: {
        //         SAVE: {
        //           target: "Creating",
        //           actions: assign({
        //             createdBy: ({ event }) => {
        //               return event.caller.id;
        //             },
        //           }),
        //         },
        //       },
        //     },
        //     Error: {
        //       entry: ({ event }) => {
        //         console.log(event);
        //       },
        //     },
        //     Creating: {
        //       invoke: {
        //         onDone: {
        //           target: "Idle",
        //           actions: assign(({ context, event }) => {
        //             return produce(context, (draft) => {
        //               draft.createdRecipeSlugs.push(event.output);
        //             });
        //           }),
        //         },
        //         onError: "Error",
        //         input: ({ context }) => {
        //           const currentRecipeId =
        //             context.suggestedRecipes[context.currentItemIndex];
        //           assert(currentRecipeId, "expected currentRecipeId");
        //           let recipe = context.recipes[currentRecipeId];
        //           assert(recipe, "expected currentRecipe");
        //           assert(context.createdBy, "expected createdBy when savings");
        //           return {
        //             recipe,
        //             prompt: context.prompt,
        //             tokens: context.tokens,
        //             createdBy: context.createdBy,
        //           };
        //         },
        //         src: "createNewRecipe",
        //       },
        //     },
        //   },
        // },

        Generators: {
          type: "parallel",
          on: {
            CLEAR: [".Placeholder.Idle", ".Tokens.Idle", ".Recipes.Idle"],
            // PREV: [
            //   {
            //     target: [
            //       ".Placeholder.Generating",
            //       ".Tokens.Generating",
            //       ".Recipes.Generating",
            //     ],
            //     actions: [
            //       "resetSuggestions",
            //       assign({
            //         inputHash: ({ context, event }) => {
            //           return generateUrlSafeHash(buildInput(context));
            //         },
            //       }),
            //     ],
            //     guard: "shouldRunInput",
            //   },
            //   {
            //     target: [
            //       ".Placeholder.Idle",
            //       ".Tokens.Idle",
            //       ".Recipes.Idle",
            //       // ".CurrentRecipe.Idle",
            //     ],
            //     guard: ({ context }) => {
            //       const hash = generateUrlSafeHash(
            //         buildInput({
            //           prompt: context.prompt,
            //           tokens: context.tokens,
            //         })
            //       );

            //       const patch =
            //         context.undoOperations[context.undoOperations.length - 1];
            //       assert(patch, "expected patch");
            //       const nextContext = produce(context, (draft) => {
            //         applyPatch(draft, patch);
            //       });
            //       const nextInput = buildInput(nextContext);

            //       return !nextInput.length;
            //     },
            //     actions: assign({
            //       inputHash: undefined,
            //       generatingRecipeId: undefined,
            //     }),
            //   },
            // ],
            REMOVE_TOKEN: [
              {
                target: [
                  ".Placeholder.Generating",
                  ".Tokens.Generating",
                  ".Recipes.Generating",
                ],
                actions: [
                  "resetSuggestions",
                  assign({
                    inputHash: ({ context, event }) => {
                      return generateUrlSafeHash(
                        buildInput({
                          prompt: context.prompt,
                          tokens: context.tokens.filter(
                            (token) => token !== event.token
                          ),
                        })
                      );
                    },
                  }),
                ],
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
                  inputHash: undefined,
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
                  inputHash: ({ context, event }) => {
                    const input = buildInput({
                      prompt: context.prompt,
                      tokens: context.tokens,
                    });
                    return generateUrlSafeHash(input);
                  },
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
                  inputHash: ({ context, event }) =>
                    generateUrlSafeHash(
                      buildInput({
                        prompt: context.prompt,
                        tokens: context.tokens,
                      })
                    ),
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
                        : buildInput(context),
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
                      prompt: buildInput(context),
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
                      initial: "Generating",
                      description:
                        "Continously generates name and description metadata for recipes up until currentItemIndex + 6",
                      states: {
                        Waiting: {
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
                          on: {
                            INSTANT_RECIPE_METADATA_START: {
                              actions: assign(({ context, event }) =>
                                produce(context, (draft) => {
                                  const id = randomUUID();
                                  draft.suggestedRecipes.push(id);
                                  draft.recipes[id] = {
                                    id,
                                    versionId: 0,
                                    complete: false,
                                  };
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
                                      // slug:
                                    };
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
                              const previousRejections =
                                context.suggestedRecipes.map(
                                  (id) => context.recipes[id]!
                                );
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
                      on: {
                        SCROLL_INDEX: [
                          {
                            target: ".Generating",
                            guard: ({ event, context }) => {
                              const nextId = findNextUncompletedRecipe({
                                ...context,
                                currentItemIndex: event.index,
                              });
                              return (
                                !!nextId &&
                                nextId !== context.generatingRecipeId
                              );
                            },
                            actions: assign({
                              generatingRecipeId: ({ context }) =>
                                findNextUncompletedRecipe(context),
                            }),
                          },
                        ],
                        NEXT: [
                          {
                            target: ".Generating",
                            guard: ({ context }) => {
                              const nextId = findNextUncompletedRecipe({
                                ...context,
                                currentItemIndex: context.currentItemIndex + 1,
                              });
                              return (
                                !!nextId &&
                                nextId !== context.generatingRecipeId
                              );
                            },
                            actions: assign({
                              generatingRecipeId: ({ context }) =>
                                findNextUncompletedRecipe(context),
                            }),
                          },
                        ],
                      },
                      states: {
                        Waiting: {
                          on: {
                            INSTANT_RECIPE_METADATA_COMPLETE: [
                              {
                                target: "Generating",
                                guard: ({ context }) => {
                                  const nextId = findNextUncompletedRecipe({
                                    ...context,
                                    numCompletedRecipeMetadata:
                                      context.numCompletedRecipeMetadata + 1,
                                  });
                                  return (
                                    !!nextId &&
                                    nextId !== context.generatingRecipeId
                                  );
                                },
                                actions: assign({
                                  generatingRecipeId: ({ context }) => {
                                    const next = findNextUncompletedRecipe({
                                      ...context,
                                      numCompletedRecipeMetadata:
                                        context.numCompletedRecipeMetadata + 1,
                                    });
                                    return next;
                                  },
                                }),
                              },
                            ],
                          },
                        },
                        Generating: {
                          invoke: {
                            onDone: [
                              {
                                target: "Generating",
                                guard: ({ context }) => {
                                  assert(
                                    context.generatingRecipeId,
                                    "expected generatingRecipeId"
                                  );
                                  return !!findNextUncompletedRecipe(context);
                                },
                                actions: [
                                  // todo: dry up get input with below
                                  spawnChild("createNewRecipe", {
                                    input: ({ context }) =>
                                      getCurrentRecipeCreateInput({ context }),
                                  }),
                                  assign({
                                    generatingRecipeId: ({ context }) => {
                                      assert(
                                        context.generatingRecipeId,
                                        "expected generatingRecipeId"
                                      );
                                      const next =
                                        findNextUncompletedRecipe(context);
                                      return next;
                                    },
                                  }),
                                ],
                                reenter: true,
                              },
                              {
                                target: "Waiting",
                                actions: spawnChild("createNewRecipe", {
                                  input: ({ context }) =>
                                    getCurrentRecipeCreateInput({ context }),
                                }),
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
                                    slug: getSlug({
                                      id: generatingRecipeId,
                                      name: recipe.name!,
                                    }),
                                    complete: true,
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

interface RecipeFunctionArgs {
  suggestedRecipes: string[];
  recipes: Record<string, { complete: boolean }>;
  currentItemIndex: number;
  numCompletedRecipeMetadata: number;
}

const findNextUncompletedRecipe = ({
  suggestedRecipes,
  recipes,
  currentItemIndex,
  numCompletedRecipeMetadata,
}: RecipeFunctionArgs) => {
  // Start the search from the next item after the currentItemIndex
  for (
    let i = currentItemIndex;
    i < Math.max(suggestedRecipes.length, numCompletedRecipeMetadata);
    i++
  ) {
    const recipeId = suggestedRecipes[i]!;
    if (!recipes[recipeId]?.complete) {
      // Found the next uncompleted recipe
      return recipeId;
    }
  }

  // No more uncompleted recipes after the current one
  return undefined;
};

const getCurrentRecipeCreateInput = ({ context }: { context: Context }) => {
  assert(context.generatingRecipeId, "expected currentRecipeId");
  let recipe = context.recipes[context.generatingRecipeId];
  assert(recipe, "expected currentRecipe");
  return {
    recipe,
    prompt: context.prompt,
    tokens: context.tokens,
    createdBy: context.initialCaller.id,
  };
};

const createListRecipe = async (
  dbOrTransaction: DbOrTransaction,
  userId: string,
  recipeId: string,
  listId: string
) => {
  const queryRunner =
    dbOrTransaction instanceof PgTransaction ? dbOrTransaction : db;

  try {
    const result = await withDatabaseSpan(
      queryRunner
        .insert(ListRecipeTable)
        .values({
          userId: userId,
          recipeId: recipeId,
          listId: listId,
          addedAt: sql`NOW()`, // Automatically set the added time to now
        })
        // Handling potential unique constraint violation
        .onConflictDoNothing({
          target: [ListRecipeTable.listId, ListRecipeTable.recipeId],
        }),
      "createListRecipe"
    ).execute();

    if (result.count === 0) {
      throw new Error("This recipe is already in the list.");
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
};

const ensureMyRecipesList = async (
  dbOrTransaction: DbOrTransaction,
  userId: string
) => {
  const queryRunner =
    dbOrTransaction instanceof PgTransaction ? dbOrTransaction : db;

  try {
    // First, attempt to find the user's "My Recipes" list.
    let result = await withDatabaseSpan(
      queryRunner
        .select({
          id: ListTable.id,
        })
        .from(ListTable)
        .where(
          and(eq(ListTable.slug, "my-recipes"), eq(ListTable.createdBy, userId))
        ),
      "findMyRecipesList"
    ).execute();

    // If the list exists, return the list ID.
    let item = result[0];
    if (item) {
      return { success: true, listId: item.id } as const;
    }

    // If the list does not exist, create it.
    result = await withDatabaseSpan(
      queryRunner.insert(ListTable).values({
        slug: "my-recipes",
        name: "My Recipes",
        createdBy: userId,
        createdAt: sql`NOW()`, // Automatically set the creation time to now
      }),
      "createMyRecipesList"
    ).execute();

    item = result[0];

    if (!item) {
      return {
        success: false,
        error: "was not able to insert my-recipes list",
      } as const;
    }

    return { success: true, listId: item.id } as const;
  } catch (error) {
    return { success: false, error: getErrorMessage(error) } as const;
  }
};
