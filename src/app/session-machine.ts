import { streamToObservable } from "@/lib/stream-to-observable";
import { appendValueWithComma } from "@/lib/string";
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
      suggestedRecipes: { name?: string; description?: string }[];
      suggestedRecipesResultId?: string;
      suggestedTags: string[];
      suggestedTagsResultId?: string;
      suggestedIngredients: string[];
      suggestedIngredientssResultId?: string;
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
  actions: {
    resetSuggestions: assign({
      suggestedTags: [],
      suggestedTagsResultId: "",
      suggestedIngredients: [],
      suggestedIngredientssResultId: "",
      suggestedRecipes: [],
      suggestedRecipesResultId: "",
    }),
  },
}).createMachine({
  id: "UserAppMachine",
  context: ({ input }) => ({
    distinctId: input.id,
    prompt: "",
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
                }),
              ],
            },
            ADD_TAG: {
              actions: [
                "resetSuggestions",
                assign({
                  prompt: ({ context, event }) =>
                    appendValueWithComma(context.prompt, event.tag),
                }),
              ],
            },
            ADD_INGREDIENT: {
              actions: [
                "resetSuggestions",
                assign({
                  prompt: ({ context, event }) =>
                    appendValueWithComma(context.prompt, event.ingredient),
                }),
              ],
            },
            SET_INPUT: {
              actions: [
                "resetSuggestions",
                assign({
                  prompt: ({ event }) => event.value,
                }),
              ],
            },
          },
        },

        Generators: {
          type: "parallel",
          states: {
            Tags: {
              initial: "Idle",
              on: {
                ADD_INGREDIENT: ".Generating",
                ADD_TAG: ".Generating",
                SET_INPUT: [
                  {
                    target: ".Holding",
                    guard: ({ event }) => !!event.value?.length,
                  },
                  { target: ".Idle" },
                ],
              },
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
                    TAG_START: {
                      actions: assign({
                        suggestedTagsResultId: ({ event }) => event.resultId,
                      }),
                    },
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
                    input: ({ context }) => ({ prompt: context.prompt }),
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
              on: {
                ADD_INGREDIENT: ".Generating",
                ADD_TAG: ".Generating",
                SET_INPUT: [
                  {
                    target: ".Holding",
                    guard: ({ event }) => !!event.value?.length,
                  },
                  { target: ".Idle" },
                ],
              },
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
                    INGREDIENT_START: {
                      actions: assign({
                        suggestedIngredientssResultId: ({ event }) =>
                          event.resultId,
                      }),
                    },
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
                    input: ({ context }) => ({ prompt: context.prompt }),
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
              on: {
                ADD_INGREDIENT: ".Generating",
                ADD_TAG: ".Generating",
                SET_INPUT: [
                  {
                    target: ".Holding",
                    guard: ({ event }) => !!event.value?.length,
                  },
                  { target: ".Idle" },
                ],
              },
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
                    RECIPE_START: {
                      actions: [
                        assign({
                          suggestedRecipesResultId: ({ event }) =>
                            event.resultId,
                        }),
                        () => {
                          console.log("start");
                        },
                      ],
                    },
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
                    input: ({ context }) => ({ prompt: context.prompt }),
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
