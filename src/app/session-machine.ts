import { streamToObservable } from "@/lib/stream-to-observable";
import { produce } from "immer";

import { assert } from "@/lib/utils";
import { AppEvent } from "@/types";
import { nanoid } from "ai";
import { from, switchMap } from "rxjs";
import { assign, fromEventObservable, setup } from "xstate";
import { z } from "zod";
import { AutoSuggestIngredientEvent } from "./auto-suggest-ingredients.stream";
import {
  AutoSuggestPlaceholderEvent,
  AutoSuggestPlaceholderOutputSchema,
  AutoSuggestPlaceholderStream,
} from "./auto-suggest-placeholder.stream";
import {
  AutoSuggestRecipesEvent,
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

// const autoSuggestionOutputSchemas = {
//   tags: InstantRecipeMetadataPredictionOutputSchema,
//   ingredients: InstantRecipeMetadataPredictionOutputSchema,
//   recipes: SuggestionPredictionOutputSchema,
// };

const InputSchema = z.object({
  id: z.string(),
});
type Input = z.infer<typeof InputSchema>;

// type AutoSuggestRecipeEvent = StreamObservableEvent<
//   "RECIPE",
//   z.infer<typeof autoSuggestIngredientsOutputSchema>
// >;

export const sessionMachine = setup({
  types: {
    input: {} as Input,
    context: {} as {
      distinctId: string;
      prompt: string;
      runningInput: string | undefined;
      tokens: string[];
      // suggestedRecipes: { name?: string; description?: string }[];
      suggestedRecipes: string[];
      recipes: Record<string, { name?: string; description?: string }>;
      generatingRecipeId: string | undefined;
      currentItemIndex: number;
      numCompletedRecipes: number;
      numStartedRecipes: number;
      suggestedTags: string[];
      suggestedText: string[];
      suggestedTokens: string[];
      placeholders: string[];
      suggestedIngredients: string[];
    },
    events: {} as
      | AppEvent
      | AutoSuggestTagEvent
      | AutoSuggestIngredientEvent
      | AutoSuggestRecipesEvent
      | AutoSuggestTextEvent
      | AutoSuggestTokensEvent
      | AutoSuggestPlaceholderEvent,
  },
  actors: {
    // autoSuggestMachine,
  },
  guards: {
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
      assert(false, "unhandled event type: " + event.type);
    },
  },
  actions: {
    updateNumCompleted: assign(({ context, event }) => {
      return produce(context, (draft) => {
        if (event.type === "RECIPE_PROGRESS") {
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
        } else if (event.type === "RECIPE_COMPLETE") {
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
    placeholders: defaultPlaceholders,
  }),
  type: "parallel",
  states: {
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
            CLEAR: {
              actions: [
                "resetSuggestions",
                assign({
                  prompt: "",
                  runningInput: undefined,
                  tokens: [],
                }),
              ],
            },
            REMOVE_TOKEN: {
              actions: [
                "resetSuggestions",
                assign({
                  tokens: ({ context, event }) =>
                    context.tokens.filter((token) => token !== event.token),
                  runningInput: ({ context, event }) =>
                    buildSuggestionsInput({
                      prompt: context.prompt,
                      tokens: context.tokens.filter(
                        (token) => token !== event.token
                      ),
                    }),
                }),
              ],
            },
            ADD_TOKEN: {
              actions: [
                "resetSuggestions",
                assign({
                  tokens: ({ context, event }) => [
                    ...context.tokens,
                    event.token,
                  ],
                  runningInput: ({ context, event }) =>
                    buildSuggestionsInput({
                      prompt: context.prompt,
                      tokens: [...context.tokens, event.token],
                    }),
                }),
              ],
              guard: "shouldRunInput",
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
            REMOVE_TOKEN: {
              target: [
                ".Placeholder.Generating",
                ".Tokens.Generating",
                // ".Tags.Generating",
                // ".Ingredients.Generating",
                ".Recipes.Generating",
              ],
              guard: ({ context, event }) => {
                const input = buildSuggestionsInput({
                  prompt: context.prompt,
                  tokens: context.tokens.filter(
                    (token) => token !== event.token
                  ),
                });
                return !!input.length;
              },
            },
            ADD_TOKEN: {
              target: [
                ".Placeholder.Generating",
                ".Tokens.Generating",
                // ".Tags.Generating",
                // ".Ingredients.Generating",
                ".Recipes.Generating",
              ],
              guard: "shouldRunInput",
            },
            SET_INPUT: [
              {
                target: [
                  ".Placeholder.Holding",
                  ".Tokens.Holding",
                  // ".Tags.Holding",
                  // ".Ingredients.Holding",
                  ".Recipes.Holding",
                ],
                guard: ({ event }) => !!event.value?.length,
              },
              {
                target: [
                  ".Placeholder.Idle",
                  ".Tokens.Idle",
                  // ".Text.Idle",
                  // ".Tags.Idle",
                  // ".Ingredients.Idle",
                  ".Recipes.Idle",
                ],
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
                        : context.runningInput,
                    }),
                    src: fromEventObservable(
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
                      prompt: context.runningInput,
                    }),
                    src: fromEventObservable(
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
                    onDone: {
                      target: "Idle",
                    },
                  },
                },
              },
            },
            // Text: {
            //   initial: "Idle",
            //   states: {
            //     Idle: {},
            //     Holding: {
            //       after: {
            //         300: {
            //           target: "Generating",
            //           guard: ({ context }) => !!context.prompt?.length,
            //         },
            //       },
            //     },
            //     Generating: {
            //       on: {
            //         // TAG_START: {
            //         //   actions: assign({
            //         //     suggestedTagsResultId: ({ event }) => event.resultId,
            //         //   }),
            //         // },
            //         TEXT_PROGRESS: {
            //           actions: assign({
            //             suggestedText: ({ event }) => event.data.items || [],
            //           }),
            //         },
            //         TEXT_COMPLETE: {
            //           actions: assign({
            //             suggestedText: ({ event }) => event.data.items,
            //           }),
            //         },
            //       },
            //       invoke: {
            //         input: ({ context }) => ({
            //           prompt: context.prompt,
            //         }),
            //         src: fromEventObservable(
            //           ({ input }: { input: { prompt: string } }) => {
            //             const tokenStream = new AutoSuggestTextStream();
            //             return from(tokenStream.getStream(input)).pipe(
            //               switchMap((stream) => {
            //                 return streamToObservable(
            //                   stream,
            //                   "TEXT",
            //                   AutoSuggestTextOutputSchema
            //                 );
            //               })
            //             );
            //           }
            //         ),
            //         onDone: {
            //           target: "Idle",
            //         },
            //       },
            //     },
            //   },
            // },
            // Tags: {
            //   initial: "Idle",
            //   states: {
            //     Idle: {},
            //     Holding: {
            //       after: {
            //         500: {
            //           target: "Generating",
            //           guard: ({ context }) => !!context.prompt?.length,
            //         },
            //       },
            //     },
            //     Generating: {
            //       on: {
            //         // TAG_START: {
            //         //   actions: assign({
            //         //     suggestedTagsResultId: ({ event }) => event.resultId,
            //         //   }),
            //         // },
            //         TAG_PROGRESS: {
            //           actions: assign({
            //             suggestedTags: ({ event }) => event.data.tags || [],
            //           }),
            //         },
            //         TAG_COMPLETE: {
            //           actions: assign({
            //             suggestedTags: ({ event }) => event.data.tags,
            //           }),
            //         },
            //       },
            //       invoke: {
            //         input: ({ context }) => ({
            //           prompt: context.runningInput,
            //         }),
            //         src: fromEventObservable(
            //           ({ input }: { input: { prompt: string } }) => {
            //             const tokenStream = new AutoSuggestTagsStream();
            //             return from(tokenStream.getStream(input)).pipe(
            //               switchMap((stream) => {
            //                 return streamToObservable(
            //                   stream,
            //                   "TAG",
            //                   AutoSuggestTagOutputSchema
            //                 );
            //               })
            //             );
            //           }
            //         ),
            //         onDone: {
            //           target: "Idle",
            //         },
            //       },
            //     },
            //   },
            // },
            // Ingredients: {
            //   initial: "Idle",
            //   states: {
            //     Idle: {},
            //     Holding: {
            //       after: {
            //         500: {
            //           target: "Generating",
            //           guard: ({ context }) => !!context.prompt?.length,
            //         },
            //       },
            //     },
            //     Generating: {
            //       on: {
            //         // INGREDIENT_START: {
            //         //   actions: assign({
            //         //     suggestedIngredientssResultId: ({ event }) =>
            //         //       event.resultId,
            //         //   }),
            //         // },
            //         INGREDIENT_PROGRESS: {
            //           actions: assign({
            //             suggestedIngredients: ({ event }) =>
            //               event.data.ingredients || [],
            //           }),
            //         },
            //         INGREDIENT_COMPLETE: {
            //           actions: assign({
            //             suggestedIngredients: ({ event }) =>
            //               event.data.ingredients,
            //           }),
            //         },
            //       },
            //       invoke: {
            //         input: ({ context }) => ({
            //           prompt: context.runningInput,
            //         }),
            //         src: fromEventObservable(
            //           ({ input }: { input: { prompt: string } }) => {
            //             const tokenStream = new AutoSuggestIngredientStream();
            //             return from(tokenStream.getStream(input)).pipe(
            //               switchMap((stream) => {
            //                 return streamToObservable(
            //                   stream,
            //                   "INGREDIENT",
            //                   AutoSuggestIngredientsOutputSchema
            //                 );
            //               })
            //             );
            //           }
            //         ),
            //         onDone: {
            //           target: "Idle",
            //         },
            //       },
            //     },
            //   },
            // },
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
                    RECIPE_START: {
                      actions: [
                        assign({
                          numStartedRecipes: ({ context }) =>
                            context.numStartedRecipes + 6,
                        }),
                      ],
                    },
                    RECIPE_PROGRESS: {
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
                            // event.data.recipes?.forEach((recipe, index) => {
                            // context.numStartedRecipes
                            // const batchCompleteCount = event.data.recipes
                            //   ?.length
                            //   ? event.data.recipes.length - 1
                            //   : 0;
                            // const incompleteCount =
                            //   context.numStartedRecipes -
                            //   batchCompleteCount -
                            //   (context.numStartedRecipes - 6);

                            // context.numCompletedRecipes =
                            //   context.numStartedRecipes - incompleteCount;

                            // let recipeId =
                            //   context.suggestedRecipes[
                            //     context.numCompletedRecipes + index
                            //   ];
                            // if (!recipeId) {
                            //   console.log(
                            //     "PUSH!",
                            //     recipeId,
                            //     "index",
                            //     index,
                            //     "comleted",
                            //     context.numCompletedRecipes,
                            //     "data len",
                            //     event.data.recipes?.length
                            //   );
                            //   recipeId = nanoid();
                            //   draft.suggestedRecipes = [
                            //     ...context.suggestedRecipes,
                            //     recipeId,
                            //   ];
                            // }

                            // });
                          })
                        ),
                      ],
                    },
                    RECIPE_COMPLETE: {
                      actions: "updateNumCompleted",
                    },
                  },
                  invoke: {
                    input: ({ context }) => ({
                      prompt: context.runningInput,
                    }),
                    src: fromEventObservable(
                      ({ input }: { input: { prompt: string } }) => {
                        const tokenStream = new AutoSuggestRecipesStream();
                        return from(tokenStream.getStream(input)).pipe(
                          switchMap((stream) => {
                            return streamToObservable(
                              stream,
                              "RECIPE",
                              AutoSuggestRecipesOutputSchema
                            );
                          })
                        );
                      }
                    ),
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
