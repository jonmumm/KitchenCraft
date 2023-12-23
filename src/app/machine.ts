import {
  GeneratorObervableEvent,
  eventSourceToGenerator,
} from "@/lib/generator";
import { assert } from "@/lib/utils";
import {
  InstantRecipeMetadataPredictionOutputSchema,
  SuggestionPredictionOutputSchema,
} from "@/schema";
import {
  AppEvent,
  InstantRecipeMetadataPredictionOutput,
  InstantRecipeMetdataInput,
  SuggestionPredictionOutput,
  SuggestionsInput,
} from "@/types";
import { parseAsString } from "next-usequerystate";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  ActorRefFrom,
  SnapshotFrom,
  assign,
  createMachine,
  fromEventObservable,
  fromPromise,
  raise,
} from "xstate";
import { z } from "zod";
import { ContextSchema } from "./@craft/schemas";
import type {
  CreateNewInstantRecipe,
  CreateNewRecipeFromSuggestion,
} from "./layout";
import { ingredientsParser, tagsParser } from "./parsers";

const getInstantRecipeMetadataEventSource = (input: SuggestionsInput) => {
  const params = new URLSearchParams();
  if (input.prompt) params.set("prompt", input.prompt);

  const eventSourceUrl = `/api/instant-recipe?${params.toString()}`;
  return new EventSource(eventSourceUrl);
};

export const createCraftMachine = ({
  searchParams,
  router,
  serverActions,
  initialPath,
}: {
  searchParams: Record<string, string>;
  router: AppRouterInstance;
  serverActions: {
    createNewInstantRecipe: CreateNewInstantRecipe;
    createNewRecipeFromSuggestion: CreateNewRecipeFromSuggestion;
  };
  initialPath: string;
}) => {
  const instantRecipeMetadataGenerator = fromEventObservable(
    ({ input }: { input: InstantRecipeMetdataInput }) => {
      const source = getInstantRecipeMetadataEventSource(input);
      return eventSourceToGenerator(
        source,
        "INSTANT_RECIPE_METADATA",
        InstantRecipeMetadataPredictionOutputSchema
      );
    }
  );
  const suggestionsGenerator = fromEventObservable(
    ({ input }: { input: SuggestionsInput }) => {
      const source = getSuggestionsEventSource(input);
      return eventSourceToGenerator(
        source,
        "SUGGESTION",
        SuggestionPredictionOutputSchema
      );
    }
  );

  const createNewInstantRecipe = fromPromise(
    async ({
      input,
    }: {
      input: { instantRecipeResultId: string; prompt: string };
    }) => {
      return await serverActions.createNewInstantRecipe(
        input.prompt,
        input.instantRecipeResultId
      );
    }
  );
  const createNewRecipeFromSuggestion = fromPromise(
    async ({
      input,
    }: {
      input: { suggestionsResultId: string; index: number };
    }) =>
      await serverActions.createNewRecipeFromSuggestion(
        input.suggestionsResultId,
        input.index
      )
  );

  const getSuggestionsEventSource = (input: SuggestionsInput) => {
    const params = new URLSearchParams();
    if (input.prompt) params.set("prompt", input.prompt);
    if (input.ingredients)
      params.set("ingredients", ingredientsParser.serialize(input.ingredients));
    if (input.tags) params.set("tags", tagsParser.serialize(input.tags));

    const eventSourceUrl = `/api/suggestions?${params.toString()}`;
    return new EventSource(eventSourceUrl);
  };

  const initialContext = (() => {
    const prompt = parseAsString.parseServerSide(searchParams["prompt"]);
    const ingredients =
      searchParams["ingredients"] &&
      ingredientsParser.parseServerSide(searchParams["ingredients"]);
    const tags =
      searchParams["tags"] && tagsParser.parseServerSide(searchParams["tags"]);

    return {
      prompt: prompt || undefined,
      ingredients: ingredients || undefined,
      tags: tags || undefined,
      suggestions: null,
      substitutions: undefined,
      dietaryAlternatives: undefined,
      equipmentAdaptations: undefined,
      submittedInputHash: undefined,
    } satisfies Context;
  })();
  const initialOpen = searchParams["crafting"] === "1" ? "True" : "False";
  // const initialOpen = initialPath.startsWith("/?craft") ? "True" : "False";
  // if (!initialOpen) router.prefetch("/craft");

  return createMachine(
    {
      id: "CraftMachine",
      context: initialContext,
      types: {
        context: {} as Context,
        events: {} as AppEvent | GeneratorEvent,
        guards: {} as  //   } //     type: "didCompleteEquipmentAdaptations"; // | { //   } //     type: "didCompleteDietaryAlternatives"; // | { //   } //     type: "didCompleteSubstitutions"; // | { //   } //     }; //       pathname: string; //     params: { //     type: "didNavigateToRecipe"; // | {
          | {
              type: "isInputFocused";
            }
          | {
              type: "hasPristineInput";
            }
          | {
              type: "hasDirtyInput";
            },
        actors: {} as
          | {
              src: "instantRecipeMetadataGenerator";
              logic: typeof instantRecipeMetadataGenerator;
            }
          | {
              src: "suggestionsGenerator";
              logic: typeof suggestionsGenerator;
            }
          | {
              src: "createNewInstantRecipe";
              logic: typeof createNewInstantRecipe;
            }
          | {
              src: "createNewRecipeFromSuggestion";
              logic: typeof createNewRecipeFromSuggestion;
            },
        //   | {
        //       src: "suggestionsGenerator";
        //       logic: typeof suggestionsGenerator;
        //     }
        actions: {} as
          | {
              type: "assignPrompt";
              params: { prompt: string | undefined };
            }
          | {
              type: "replaceQueryParameters";
              params: { paramSet: Record<string, string | undefined> };
            }
          | {
              type: "pushQueryParameters";
              params: { paramSet: Record<string, string | undefined> };
            }
          | {
              type: "focusInput";
            },
      },
      type: "parallel",
      states: {
        Creating: {
          initial: "False",
          on: {
            INSTANT_RECIPE: {
              target: ".InstantRecipe",
              guard: ({ context }) => !!context.instantRecipeMetadata,
            },
            SELECT_RESULT: {
              target: ".SuggestionRecipe",
              actions: assign({
                currentItemIndex: ({ event }) => event.index,
              }),
            },
            SET_INPUT: ".False",
          },
          states: {
            InstantRecipe: {
              invoke: {
                src: "createNewInstantRecipe",
                onDone: {
                  target: "Navigating",
                  actions: [
                    ({ context, event }) => {
                      router.push(
                        `${event.output.data.recipeUrl}?prompt=${context.prompt}`
                      );
                    },
                  ],
                },
                input: ({ context }) => {
                  const { instantRecipeResultId, prompt } = context;
                  assert(
                    instantRecipeResultId,
                    "expected instantRecipeResultId"
                  );
                  assert(prompt, "expected prompt");
                  return { instantRecipeResultId, prompt };
                },
              },
            },
            SuggestionRecipe: {
              invoke: {
                src: "createNewRecipeFromSuggestion",
                onDone: {
                  target: "Navigating",
                  actions: [
                    ({ event, context }) => {
                      if (event.output.success) {
                        router.push(
                          `${event.output.data.recipeUrl}?prompt=${context.prompt}`
                        );
                        // router.refresh();
                      } else {
                        // todo show notif
                        console.error("error creating recipe");
                      }
                    },
                    // raise({ type: "CLOSE" }),
                  ],
                },
                input: ({ context }) => {
                  const { suggestionsResultId, currentItemIndex } = context;
                  assert(suggestionsResultId, "expected suggestionResultId");
                  assert(
                    typeof currentItemIndex !== "undefined",
                    "expected currentItemIndex"
                  );
                  return { suggestionsResultId, index: currentItemIndex };
                },
              },
            },
            Navigating: {
              on: {
                PAGE_LOADED: {
                  actions: [raise({ type: "CLOSE" })],
                },
              },
            },
            False: {},
          },
        },
        InstantRecipe: {
          initial: "Idle",
          on: {
            CLOSE: {
              target: ".Idle",
            },
          },
          states: {
            Idle: {
              on: {
                SET_INPUT: {
                  target: "Holding",
                  guard: ({ context }) => !!context.prompt?.length,
                },
              },
            },
            Holding: {
              entry: [
                assign({
                  instantRecipeMetadata: undefined,
                  instantRecipeResultId: undefined,
                }),
                {
                  type: "replaceQueryParameters",
                  params() {
                    return {
                      paramSet: {
                        instantRecipeResultId: undefined,
                      },
                    };
                  },
                },
              ],
              on: {
                SET_INPUT: [
                  {
                    target: "Holding",
                    guard: ({ context }) => !!context.prompt?.length,
                  },
                  { target: "Idle" },
                ],
              },
              after: {
                1250: {
                  target: "InProgress",
                  guard: ({ context }) => !!context.prompt?.length,
                },
              },
            },
            InProgress: {
              invoke: {
                src: "instantRecipeMetadataGenerator",
                input: ({ context }) => {
                  assert(context.prompt, "expected prompt");
                  return { prompt: context.prompt };
                },
                onDone: "Idle",
              },
              on: {
                SET_INPUT: {
                  target: "Holding",
                  actions: assign({
                    instantRecipeMetadata: undefined,
                  }),
                },
                INSTANT_RECIPE_METADATA_START: {
                  actions: [
                    assign({
                      instantRecipeResultId: ({ event }) => event.resultId,
                    }),
                  ],
                },
                INSTANT_RECIPE_METADATA_PROGRESS: {
                  actions: assign({
                    instantRecipeMetadata: ({ event }) => event.data,
                  }),
                },
                INSTANT_RECIPE_METADATA_COMPLETE: {
                  actions: [
                    assign({
                      instantRecipeMetadata: ({ event }) => event.data,
                    }),

                    {
                      type: "replaceQueryParameters",
                      params({ context }) {
                        return {
                          paramSet: {
                            instantRecipeResultId:
                              context.instantRecipeResultId,
                          },
                        };
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        Suggestions: {
          initial: "Idle",
          on: {
            CLOSE: {
              target: ".Idle",
            },
          },
          states: {
            Idle: {
              on: {
                SET_INPUT: {
                  target: "Holding",
                  guard: ({ context }) => !!context.prompt?.length,
                },
              },
            },
            Holding: {
              entry: [
                assign({
                  suggestions: undefined,
                  suggestionsResultId: undefined,
                }),
                {
                  type: "replaceQueryParameters",
                  params({ context, event }) {
                    return {
                      paramSet: {
                        suggestionsResultId: undefined,
                      },
                    };
                  },
                },
              ],
              on: {
                SET_INPUT: [
                  {
                    target: "Holding",
                    guard: ({ context }) => !!context.prompt?.length,
                  },
                  { target: "Idle" },
                ],
              },
              after: {
                3000: {
                  target: "InProgress",
                  guard: ({ context }) => !!context.prompt?.length,
                },
              },
            },
            InProgress: {
              invoke: {
                src: "suggestionsGenerator",
                input: ({ context }) => {
                  assert(context.prompt, "expected prompt");
                  return { prompt: context.prompt };
                },
                onDone: "Idle",
              },
              on: {
                SET_INPUT: {
                  target: "Holding",
                  actions: assign({
                    suggestions: undefined,
                  }),
                },
                SUGGESTION_START: {
                  actions: [
                    assign({
                      suggestionsResultId: ({ event }) => event.resultId,
                    }),
                    {
                      type: "replaceQueryParameters",
                      params({ event }) {
                        return {
                          paramSet: {
                            suggestionsResultId: event.resultId,
                          },
                        };
                      },
                    },
                  ],
                },
                SUGGESTION_PROGRESS: {
                  actions: assign({
                    suggestions: ({ event }) => event.data.suggestions,
                  }),
                },
                SUGGESTION_COMPLETE: {
                  actions: [
                    assign({
                      suggestions: ({ event }) => event.data.suggestions,
                    }),
                    {
                      type: "replaceQueryParameters",
                      params({ context }) {
                        return {
                          paramSet: {
                            suggestionsResultId: context.suggestionsResultId,
                          },
                        };
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        Typing: {
          initial: "False",
          states: {
            False: {
              on: {
                SET_INPUT: "True",
              },
            },
            True: {
              after: {
                2000: {
                  target: "False",
                },
              },
              on: {
                SET_INPUT: {
                  target: "True",
                  reenter: true,
                },
              },
            },
          },
        },
        Open: {
          initial: initialOpen,
          states: {
            True: {
              entry: [
                () => {
                  document.body.classList.add("crafting");
                },
                {
                  type: "replaceQueryParameters",
                  params() {
                    return {
                      paramSet: {
                        crafting: "1",
                      },
                    };
                  },
                },
                {
                  type: "focusInput",
                },
              ],
              on: {
                BLUR_PROMPT: {
                  target: "False",
                  guard: ({ context }) => !(context.prompt?.length || 0),
                  actions: [
                    {
                      type: "replaceQueryParameters",
                      params() {
                        return {
                          paramSet: {
                            crafting: undefined,
                          },
                        };
                      },
                    },
                  ],
                },
                TOGGLE: "False",
                CLOSE: "False",
                SET_INPUT: {
                  actions: [
                    {
                      type: "assignPrompt",
                      params: ({ event }) => ({
                        prompt: event.value,
                      }),
                    },
                    {
                      type: "replaceQueryParameters",
                      params({ event }) {
                        return {
                          paramSet: {
                            prompt: event.value,
                          },
                        };
                      },
                    },
                  ],
                },
              },
            },
            False: {
              entry: [
                () => {
                  document.body.classList.remove("crafting");
                  const prompt = document.querySelector(
                    "#prompt"
                  ) as HTMLTextAreaElement | null;
                  if (prompt) {
                    prompt.blur();
                  }
                },
                {
                  type: "replaceQueryParameters",
                  params() {
                    return {
                      paramSet: {
                        crafting: undefined,
                      },
                    };
                  },
                },
              ],
              on: {
                UPDATE_SEARCH_PARAMS: {
                  target: "True",
                  guard: ({ event }) => {
                    return event.searchParams["crafting"] === "1";
                  },
                },
                TOGGLE: {
                  target: "True",
                },
                FOCUS_PROMPT: {
                  target: "True",
                },
                NEW_RECIPE: {
                  target: "True",
                },
                HYDRATE_INPUT: {
                  target: "True",
                  guard: "isInputFocused",
                  actions: [
                    {
                      type: "assignPrompt",
                      params({ event }) {
                        return { prompt: event.ref.value };
                      },
                    },
                    {
                      type: "replaceQueryParameters",
                      params({ event }) {
                        return {
                          paramSet: {
                            prompt: event.ref.value,
                          },
                        };
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    {
      actions: {
        assignPrompt: assign({
          prompt: (_, params) => params.prompt,
        }),
        replaceQueryParameters: ({ context }, params) => {
          const queryParams = new URLSearchParams(window.location.search);

          for (const key in params.paramSet) {
            const value = params.paramSet[key];
            if (!!value) {
              queryParams.set(key, value);
            } else {
              queryParams.delete(key);
            }
          }

          const paramString = queryParams.toString();

          // Construct the new URL
          const newUrl =
            paramString !== ""
              ? window.location.pathname + "?" + paramString
              : window.location.pathname;
          window.history.replaceState(context, "", newUrl);
        },
        pushQueryParameters: ({ context }, params) => {
          // same as above but pushState
          const queryParams = new URLSearchParams(window.location.search);

          for (const key in params.paramSet) {
            const value = params.paramSet[key];
            if (!!value) {
              queryParams.set(key, value);
            } else {
              queryParams.delete(key);
            }
          }

          const paramString = queryParams.toString();

          // Construct the new URL
          const newUrl =
            paramString !== ""
              ? window.location.pathname + "?" + paramString
              : window.location.pathname;
          router.push(newUrl);
        },
        focusInput: () => {
          const element =
            document.querySelector<HTMLTextAreaElement>("#prompt");
          assert(element, "exlected prompt element");

          if (element.value.length) {
            element.selectionStart = element.selectionEnd =
              element.value.length;
          }
          console.log("FOCUSIN!");
          element.focus();
        },
      },
      actors: {
        instantRecipeMetadataGenerator,
        suggestionsGenerator,
        createNewInstantRecipe,
        createNewRecipeFromSuggestion,
      },
      guards: {
        hasDirtyInput: ({ context }) => {
          return !!context.prompt?.length;
        },
        hasPristineInput: ({ context }) => {
          return !context.prompt || !context.prompt.length;
        },
        isInputFocused: ({ event, ...props }) => {
          console.log("hydrate", props);
          assert(
            event.type === "HYDRATE_INPUT",
            "expected HYDRATE_INPUT event"
          );
          return event.ref === document.activeElement;
        },
      },
    }
  );
};

type CraftMachine = ReturnType<typeof createCraftMachine>;
export type CraftActor = ActorRefFrom<CraftMachine>;
export type CraftSnapshot = SnapshotFrom<CraftActor>;
type Context = z.infer<typeof ContextSchema>;

type GeneratorEvent =
  | GeneratorObervableEvent<"SUGGESTION", SuggestionPredictionOutput>
  | GeneratorObervableEvent<
      "INSTANT_RECIPE_METADATA",
      InstantRecipeMetadataPredictionOutput
    >;
