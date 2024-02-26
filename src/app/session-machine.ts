import { streamToObservable } from "@/lib/stream-to-observable";
import { assert } from "@/lib/utils";
import { AppEvent } from "@/types";
import { from, switchMap } from "rxjs";
import { assign, fromEventObservable, setup } from "xstate";
import { z } from "zod";
import {
  AutoSuggestIngredientEvent,
  AutoSuggestIngredientStream,
  AutoSuggestIngredientsOutputSchema,
} from "./auto-suggest-ingredients.stream";
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
import {
  AutoSuggestTagEvent,
  AutoSuggestTagOutputSchema,
  AutoSuggestTagsStream,
} from "./auto-suggest-tags.stream";
import {
  AutoSuggestTextEvent,
  AutoSuggestTextOutputSchema,
  AutoSuggestTextStream,
} from "./auto-suggest-text.stream";
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
      suggestedRecipes: { name?: string; description?: string }[];
      currentItemIndex: number;
      numCompletedRecipes: number;
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
    resetSuggestions: assign({
      suggestedTags: [],
      suggestedIngredients: [],
      suggestedRecipes: [],
      suggestedText: [],
      suggestedTokens: [],
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
    tokens: [],
    runningInput: undefined,
    suggestedRecipes: [],
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
                console.log(input);
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
                      prompt: context.runningInput,
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
                      if (context.numCompletedRecipes) {
                        console.log("guard", context.currentItemIndex);
                        return (
                          context.currentItemIndex + 3 >=
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
                  entry: () => {
                    console.log("Gen recie");
                  },
                  on: {
                    // RECIPE_START: {
                    //   actions: [
                    //     assign({
                    //       suggestedRecipesResultId: ({ event }) =>
                    //         event.resultId,
                    //     }),
                    //     () => {
                    //       console.log("start");
                    //     },
                    //   ],
                    // },
                    RECIPE_PROGRESS: {
                      actions: assign({
                        suggestedRecipes: ({ context, event }) => [
                          ...context.suggestedRecipes.slice(
                            0,
                            context.numCompletedRecipes
                          ),
                          ...(event.data.recipes || []),
                        ],
                      }),
                    },
                    RECIPE_COMPLETE: {
                      actions: assign({
                        numCompletedRecipes: ({ context, event }) =>
                          context.numCompletedRecipes +
                          event.data.recipes.length,
                        suggestedRecipes: ({ context, event }) => [
                          ...context.suggestedRecipes,
                          ...event.data.recipes,
                        ],
                      }),
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
                            console.log("invoking");
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
                      actions: (f) => {
                        console.log("DONE with Recipes");
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
