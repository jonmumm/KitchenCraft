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
  AutoSuggestRecipesEvent,
  AutoSuggestRecipesOutputSchema,
  AutoSuggestRecipesStream,
} from "./auto-suggest-recipes.stream";
import {
  AutoSuggestTagEvent,
  AutoSuggestTagOutputSchema,
  AutoSuggestTagsStream,
} from "./auto-suggest-tags.stream";

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
      suggestedTags: string[];
      suggestedIngredients: string[];
    },
    events: {} as
      | AppEvent
      | AutoSuggestTagEvent
      | AutoSuggestIngredientEvent
      | AutoSuggestRecipesEvent,
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
        console.log({ nextInput, runningInput: context.runningInput });
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
    }),
  },
}).createMachine({
  id: "UserAppMachine",
  context: ({ input }) => ({
    distinctId: input.id,
    prompt: "",
    tokens: [],
    runningInput: undefined,
    suggestedRecipes: [],
    suggestedTags: [],
    suggestedIngredients: [],
  }),
  type: "parallel",
  states: {
    Craft: {
      type: "parallel",
      states: {
        Input: {
          on: {
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
                ".Tags.Generating",
                ".Ingredients.Generating",
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
                ".Tags.Generating",
                ".Ingredients.Generating",
                ".Recipes.Generating",
              ],
              guard: "shouldRunInput",
            },
            SET_INPUT: [
              {
                target: [
                  ".Tags.Holding",
                  ".Ingredients.Holding",
                  ".Recipes.Holding",
                ],
                guard: ({ event }) => !!event.value?.length,
              },
              {
                target: [".Tags.Idle", ".Ingredients.Idle", ".Recipes.Idle"],
              },
            ],
          },
          states: {
            Tags: {
              initial: "Idle",
              on: {},
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
                    // TAG_START: {
                    //   actions: assign({
                    //     suggestedTagsResultId: ({ event }) => event.resultId,
                    //   }),
                    // },
                    TAG_PROGRESS: {
                      actions: assign({
                        suggestedTags: ({ event }) => event.data.tags || [],
                      }),
                    },
                    TAG_COMPLETE: {
                      actions: assign({
                        suggestedTags: ({ event }) => event.data.tags,
                      }),
                    },
                  },
                  invoke: {
                    input: ({ context }) => ({
                      prompt: context.runningInput,
                    }),
                    src: fromEventObservable(
                      ({ input }: { input: { prompt: string } }) => {
                        const tokenStream = new AutoSuggestTagsStream();
                        return from(tokenStream.getStream(input)).pipe(
                          switchMap((stream) => {
                            return streamToObservable(
                              stream,
                              "TAG",
                              AutoSuggestTagOutputSchema
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
            Ingredients: {
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
                    // INGREDIENT_START: {
                    //   actions: assign({
                    //     suggestedIngredientssResultId: ({ event }) =>
                    //       event.resultId,
                    //   }),
                    // },
                    INGREDIENT_PROGRESS: {
                      actions: assign({
                        suggestedIngredients: ({ event }) =>
                          event.data.ingredients || [],
                      }),
                    },
                    INGREDIENT_COMPLETE: {
                      actions: assign({
                        suggestedIngredients: ({ event }) =>
                          event.data.ingredients,
                      }),
                    },
                  },
                  invoke: {
                    input: ({ context }) => ({
                      prompt: context.runningInput,
                    }),
                    src: fromEventObservable(
                      ({ input }: { input: { prompt: string } }) => {
                        const tokenStream = new AutoSuggestIngredientStream();
                        return from(tokenStream.getStream(input)).pipe(
                          switchMap((stream) => {
                            return streamToObservable(
                              stream,
                              "INGREDIENT",
                              AutoSuggestIngredientsOutputSchema
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
            Recipes: {
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
                        suggestedRecipes: ({ event }) =>
                          event.data.recipes || [],
                      }),
                    },
                    RECIPE_COMPLETE: {
                      actions: assign({
                        suggestedRecipes: ({ event }) => event.data.recipes,
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
                        console.log("DONE");
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
