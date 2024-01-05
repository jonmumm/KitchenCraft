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
import { ingredientsParser, tagsParser } from "./parsers";

const getInstantRecipeMetadataEventSource = (input: SuggestionsInput) => {
  const params = new URLSearchParams();
  if (input.prompt) params.set("prompt", input.prompt);

  const eventSourceUrl = `/api/instant-recipe?${params.toString()}`;
  return new EventSource(eventSourceUrl);
};

type CreateRecipeResponse = Promise<
  | {
      success: true;
      data: {
        recipeUrl: string;
      };
    }
  | {
      success: false;
      error: string;
    }
>;

export const createCraftMachine = ({
  searchParams,
  router,
  serverActions,
  initialPath,
}: {
  searchParams: Record<string, string>;
  router: AppRouterInstance;
  serverActions: {
    createNewInstantRecipe: (
      prompt: string,
      instantRecipeResultId: string
    ) => CreateRecipeResponse;
    createNewRecipeFromSuggestion: (
      suggestionsResultId: string,
      index: number
    ) => CreateRecipeResponse;
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

  const remixSuggestionsGenerator = fromEventObservable(
    ({ input }: { input: { slug: string } }) => {
      const source = getRemixSuggestionsEventSource(input);
      return eventSourceToGenerator(
        source,
        "REMIX_SUGGESTIONS",
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

  const getRemixSuggestionsEventSource = (input: { slug: string }) => {
    const params = new URLSearchParams();

    const eventSourceUrl = `/api/recipe/${input.slug}/remix-suggestions`;
    return new EventSource(eventSourceUrl);
  };

  const initialOpen =
    searchParams["crafting"] === "1" ||
    (typeof document !== "undefined" &&
      document.body.classList.contains("crafting"))
      ? "True"
      : "False";

  // if (typeof window !== "undefined" && initialOpen) {
  //   const queryParams = new URLSearchParams(window.location.search);
  //   queryParams.set("crafting", "1");
  //   const paramString = queryParams.toString();

  //   // Construct the new URL
  //   const newUrl =
  //     paramString !== ""
  //       ? window.location.pathname + "?" + paramString
  //       : window.location.pathname;
  //   router.replace(newUrl);
  // }

  const initialContext = (() => {
    let prompt = parseAsString.parseServerSide(searchParams["prompt"]);

    // Overr-ride the prompt with whatever is in the input box if the prompt is open
    if (initialOpen && typeof document !== "undefined") {
      const promptEl = document.body.querySelector("#prompt") as
        | HTMLTextAreaElement
        | undefined;
      const value = promptEl?.value;
      if (value) {
        prompt = value;
      }
    }

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
      currentItemIndex: undefined,
      currentRecipeUrl: undefined,
    } satisfies Context;
  })();

  const initialPromptState = initialContext.prompt?.length
    ? "Dirty"
    : "Pristine";

  return createMachine(
    {
      id: "CraftMachine",
      context: initialContext,
      types: {
        context: {} as Context,
        events: {} as AppEvent | GeneratorEvent,
        guards: {} as
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
              src: "remixSuggestionsGenerator";
              logic: typeof remixSuggestionsGenerator;
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
      on: {},
      type: "parallel",
      states: {
        Creating: {
          initial: "False",
          on: {
            INSTANT_RECIPE: {
              target: ".InstantRecipe",
              guard: ({ context }) => !!context.instantRecipeMetadata,
              actions: assign({
                selection: ({ context }) => {
                  const metadata = context.instantRecipeMetadata;
                  assert(metadata?.name, "expected name");
                  assert(metadata?.description, "expected description");
                  return {
                    name: metadata.name,
                    description: metadata.description,
                  };
                },
              }),
            },
            SELECT_RESULT: {
              target: ".SuggestionRecipe",
              guard: ({ event, context }) => {
                {
                  return !!context.suggestions?.[event.index];
                }
              },
              actions: assign({
                currentItemIndex: ({ event }) => event.index,
                selection: ({ event, context }) => {
                  const metadata = context.suggestions?.[event.index];
                  assert(metadata?.name, "expected name");
                  assert(metadata?.description, "expected description");
                  return {
                    name: metadata.name,
                    description: metadata.description,
                  };
                },
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
                    assign({
                      currentRecipeUrl: ({ event }) => {
                        assert(
                          event.output.success,
                          "expected to receive recipeUrl"
                        );
                        return event.output.data.recipeUrl;
                      },
                    }),
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
                    assign({
                      currentRecipeUrl: ({ event }) => {
                        assert(
                          event.output.success,
                          "expected to receive recipeUrl"
                        );
                        return event.output.data.recipeUrl;
                      },
                    }),
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
              entry: ({ context }) => {
                router.push(
                  `${context.currentRecipeUrl}?prompt=${context.prompt}`
                );
              },
              after: {
                10000: "TimedOut",
              },
              on: {
                PAGE_LOADED: {
                  target: "False",
                  actions: [raise({ type: "CLOSE" })],
                },
              },
            },
            TimedOut: {},
            False: {},
          },
        },
        Mode: {
          initial: "New",
          states: {
            New: {
              on: {
                REMIX: {
                  target: "Remix",
                  actions: [
                    () => {
                      const promptEl = document.body.querySelector(
                        "#prompt"
                      ) as HTMLTextAreaElement | undefined;
                      if (promptEl) {
                        promptEl.value = "";
                      }
                    },
                    assign({
                      currentRemixSlug: ({ event }) => event.slug,
                      prompt: undefined,
                    }),
                    {
                      type: "replaceQueryParameters",
                      params({ context, event }) {
                        return {
                          paramSet: {
                            prompt: undefined,
                          },
                        };
                      },
                    },
                  ],
                },
              },
              description: "Creating a new recipe",
              type: "parallel",
              states: {
                InstantRecipe: {
                  initial: "Idle",
                  on: {
                    CLEAR: {
                      target: ".Idle",
                      actions: assign({
                        instantRecipeMetadata: undefined,
                        instantRecipeResultId: undefined,
                      }),
                    },
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
                        1000: {
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
                              instantRecipeResultId: ({ event }) =>
                                event.resultId,
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
                          ],
                        },
                      },
                    },
                  },
                },
                Suggestions: {
                  initial: "Idle",
                  on: {
                    CLEAR: {
                      target: ".Idle",
                      actions: assign({
                        suggestions: undefined,
                        suggestionsResultId: undefined,
                      }),
                    },
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
                        2500: {
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
                              suggestionsResultId: ({ event }) =>
                                event.resultId,
                            }),
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
                              suggestions: ({ event }) =>
                                event.data.suggestions,
                            }),
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
            Remix: {
              on: {
                PAGE_LOADED: {
                  target: "New",
                },
              },
              description: "Making changes to an existing recipe",
              type: "parallel",
              states: {
                Suggestions: {
                  initial: "Initializing",
                  states: {
                    Initializing: {
                      always: [
                        {
                          target: "Idle",
                          guard: ({ context }) => !!context.remixSuggestions,
                        },
                        { target: "InProgress" },
                      ],
                    },
                    Idle: {},
                    InProgress: {
                      onDone: "Idle",
                      invoke: {
                        src: "remixSuggestionsGenerator",
                        input: ({ context }) => {
                          assert(
                            context.currentRemixSlug,
                            "expected currentRemixSlug to be set"
                          );
                          return { slug: context.currentRemixSlug };
                        },
                        onDone: "Idle",
                      },
                      on: {
                        REMIX_SUGGESTIONS_START: {
                          actions: [
                            assign({
                              suggestionsResultId: ({ event }) =>
                                event.resultId,
                            }),
                          ],
                        },
                        REMIX_SUGGESTIONS_PROGRESS: {
                          actions: assign({
                            suggestions: ({ event }) => event.data.suggestions,
                          }),
                        },
                        REMIX_SUGGESTIONS_COMPLETE: {
                          actions: [
                            assign({
                              suggestions: ({ event }) =>
                                event.data.suggestions,
                            }),
                          ],
                        },
                      },
                    },
                  },
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
                500: {
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
        Prompt: {
          initial: initialPromptState,
          on: {
            SET_INPUT: [
              {
                target: [".Pristine"],
                guard: ({ event }) => event.value.length === 0,
              },
              {
                target: [".Dirty"],
              },
            ],
            CLEAR: {
              target: [".Pristine"],
              actions: [
                assign({
                  prompt: undefined,
                  currentItemIndex: -1,
                }),
                () => {
                  const promptEl = document.body.querySelector("#prompt") as
                    | HTMLTextAreaElement
                    | undefined;
                  if (promptEl) {
                    promptEl.value = "";
                  }
                  promptEl?.focus();
                  requestAnimationFrame(() => {
                    window.scrollTo(0, 0);
                  });
                },
                {
                  type: "replaceQueryParameters",
                  params({ context, event }) {
                    return {
                      paramSet: {
                        prompt: undefined,
                      },
                    };
                  },
                },
              ],
            },
          },
          states: {
            Dirty: {
              entry: () => {
                document.body.classList.add("prompt-dirty");
                document.body.classList.remove("prompt-pristine");
              },
            },
            Pristine: {
              entry: () => {
                document.body.classList.remove("prompt-dirty");
                document.body.classList.add("prompt-pristine");
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
                  params({ context }) {
                    const prompt = context.prompt
                      ? { prompt: context.prompt }
                      : {};
                    return {
                      paramSet: {
                        crafting: "1",
                        ...prompt,
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
                KEY_DOWN: [
                  {
                    guard: ({ context, event }) => {
                      const didPressEnter = event.keyboardEvent.key === "Enter";
                      const hasSelection =
                        typeof context.currentItemIndex !== "undefined";
                      return didPressEnter && hasSelection;
                    },
                    actions: raise(({ context, event }) => {
                      event.keyboardEvent.preventDefault();
                      assert(
                        typeof context.currentItemIndex !== "undefined",
                        "expected currentItemIndex"
                      );
                      if (context.currentItemIndex === 0) {
                        return {
                          type: "INSTANT_RECIPE" as const,
                        };
                      } else if (
                        context.currentItemIndex === 7 &&
                        context.prompt?.length
                      ) {
                        return {
                          type: "CLEAR" as const,
                        };
                      } else if (
                        context.currentItemIndex === 7 &&
                        (!context.prompt || context.prompt.length === 0)
                      ) {
                        return {
                          type: "CLOSE" as const,
                        };
                      } else {
                        return {
                          type: "SELECT_RESULT" as const,
                          index: context.currentItemIndex - 1,
                        };
                      }
                    }),
                  },
                  {
                    actions: [
                      assign({
                        currentItemIndex: ({ context, event }) => {
                          const { key, ctrlKey, shiftKey } =
                            event.keyboardEvent;
                          const { currentItemIndex } = context;
                          const latestDescriptionLength =
                            context.suggestions?.[context.suggestions.length]
                              ?.description?.length || 0;

                          const maxItemIndex = 7;

                          // const maxItemIndex = !context.instantRecipeMetadata
                          //   ? 0
                          //   : context.suggestions?.length
                          //   ? latestDescriptionLength > 10
                          //     ? context.suggestions.length + 1
                          //     : context.suggestions?.length
                          //     ? context.suggestions.length
                          //     : 1
                          //   : 0;

                          let nextItemIndex =
                            typeof currentItemIndex !== "undefined"
                              ? currentItemIndex
                              : -1;

                          switch (key) {
                            case "n":
                            case "j": {
                              // vim keybind down
                              if (ctrlKey) {
                                nextItemIndex = nextItemIndex + 1;
                              }
                              break;
                            }
                            case "ArrowDown": {
                              nextItemIndex = nextItemIndex + 1;
                              break;
                            }
                            case "p":
                            case "k": {
                              // vim keybind up
                              if (ctrlKey) {
                                nextItemIndex = nextItemIndex - 1;
                              }
                              break;
                            }
                            case "ArrowUp": {
                              nextItemIndex = nextItemIndex - 1;
                              break;
                            }
                          }

                          if (nextItemIndex < 0) {
                            return undefined;
                          }

                          if (nextItemIndex > maxItemIndex) {
                            nextItemIndex = maxItemIndex;
                          }

                          const el = document.querySelector(
                            `#result-${nextItemIndex}`
                          );

                          if (!el) {
                            // element must have unmounted, no longer selectable
                            return undefined;
                          }

                          // Scroll the element into view
                          el.scrollIntoView();

                          // Wait for the next repaint to ensure the scrolling has finished
                          requestAnimationFrame(() => {
                            const elementRect = el.getBoundingClientRect();
                            const absoluteElementTop =
                              elementRect.top + window.pageYOffset;
                            const middle =
                              absoluteElementTop - window.innerHeight / 2;
                            window.scrollTo(0, middle);
                          });

                          return nextItemIndex;
                        },
                      }),
                    ],
                  },
                ],
                // UPDATE_SEARCH_PARAMS: {
                //   guard: ({ event }) => event.searchParams["crafting"] !== "1",
                //   target: "False",
                // },
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
                assign({
                  currentItemIndex: () => {
                    return undefined;
                  },
                }),
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
                REMIX: {
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
          element.focus();
        },
      },
      actors: {
        instantRecipeMetadataGenerator,
        suggestionsGenerator,
        remixSuggestionsGenerator,
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
  | GeneratorObervableEvent<"REMIX_SUGGESTIONS", SuggestionPredictionOutput>
  | GeneratorObervableEvent<
      "INSTANT_RECIPE_METADATA",
      InstantRecipeMetadataPredictionOutput
    >;
