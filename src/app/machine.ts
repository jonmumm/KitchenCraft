import {
  GeneratorObervableEvent,
  eventSourceToGenerator,
} from "@/lib/generator";
import { assert, isMobile } from "@/lib/utils";
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
import { produce } from "immer";
import { ReadableAtom } from "nanostores";
import { Session } from "next-auth";
import { parseAsString } from "next-usequerystate";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  ActorRefFrom,
  SnapshotFrom,
  and,
  assign,
  fromEventObservable,
  setup,
} from "xstate";
import { z } from "zod";
import { ContextSchema } from "./@craft/schemas";
import { SessionSnapshot } from "./page-session-store";
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
  initialPath,
  send,
  session,
  session$,
}: {
  searchParams: Record<string, string>;
  router: AppRouterInstance;
  initialPath: string;
  send: (event: AppEvent) => void;
  session: Session | null;
  session$: ReadableAtom<SessionSnapshot>;
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

  // const createNewInstantRecipe = fromPromise(
  //   async ({
  //     input,
  //   }: {
  //     input: { instantRecipeResultId: string; prompt: string };
  //   }) => {
  //     return await serverActions.createNewInstantRecipe(
  //       input.prompt,
  //       input.instantRecipeResultId
  //     );
  //   }
  // );
  // const createNewRecipeFromSuggestion = fromPromise(
  //   async ({
  //     input,
  //   }: {
  //     input: { suggestionsResultId: string; index: number };
  //   }) =>
  //     await serverActions.createNewRecipeFromSuggestion(
  //       input.suggestionsResultId,
  //       input.index
  //     )
  // );

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
      ingredients: ingredients || undefined,
      tags: tags || undefined,
      suggestions: null,
      substitutions: undefined,
      dietaryAlternatives: undefined,
      savedRecipeSlugs: [],
      equipmentAdaptations: undefined,
      submittedInputHash: undefined,
      currentRecipeUrl: undefined,
      scrollItemIndex: 0,
    } satisfies Context;
  })();

  const initialPromptState = session$.get().context.prompt?.length
    ? "Dirty"
    : "Pristine";

  const placeholderMachine = setup({
    types: {
      input: {} as {
        ref: HTMLTextAreaElement;
      },
      context: {} as {
        currentCharIndex: number; // the end index for which characters are visible in the current placeholder string
        placeholders: string[]; // the list of placeholder strings to rotate through
      },
      events: {} as AppEvent,
    },
  }).createMachine({
    id: "PlaceholderMachine",
    context: ({ input }) => {
      return {
        currentCharIndex: 0,
        placeholders: [],
      };
    },
    // context: {
    //   currentCharIndex: 0,
    //   currentItemIndex: 0,
    //   // placeholders: ({ input } => Input.)
    // },
    initial: "Empty",
    states: {
      Empty: {
        always: "Animating",
      },
      Animating: {
        after: {},
      },
      Complete: {},
    },
  });

  return setup({
    types: {
      context: {} as Context,
      events: {} as AppEvent | GeneratorEvent,
    },
    actions: {
      replaceQueryParameters: (
        { context },
        params: { paramSet: Record<string, string | undefined> }
      ) => {
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

        // Include the location hash in the new URL
        const hash = window.location.hash;

        // Construct the new URL with the hash
        const newUrl =
          window.location.pathname +
          (paramString !== "" ? "?" + paramString : "") +
          hash;
        window.history.replaceState(context, "", newUrl);
      },
      pushQueryParameters: (
        { context },
        params: { paramSet: Record<string, string | undefined> }
      ) => {
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
      blurInput: () => {
        const element = document.querySelector<HTMLTextAreaElement>("#prompt");
        assert(element, "exlected prompt element");
        element.blur();
      },
      focusInput: () => {
        const element = document.querySelector<HTMLTextAreaElement>("#prompt");
        assert(element, "exlected prompt element");

        if (element.value.length) {
          element.selectionStart = element.selectionEnd = element.value.length;
        }
        element.focus();
      },
    },
    actors: {
      placeholderMachine,
      instantRecipeMetadataGenerator,
      suggestionsGenerator,
      remixSuggestionsGenerator,
      // createNewInstantRecipe,
      // createNewRecipeFromSuggestion,
      // waitForNewRecipeSlug: fromPromise(
      //   () =>
      //     new Promise((resolve) => {
      //       const initialNumSlugs =
      //         session$.get().context.createdRecipeSlugs.length;
      //       // todo: timeout?
      //       const unsub = session$.listen((state) => {
      //         console.log(state);
      //         if (initialNumSlugs !== state.context.createdRecipeSlugs.length) {
      //           resolve(null);
      //           unsub();
      //         }
      //       });
      //       return;
      //     })
      // ),
    },
    guards: {
      // hasDirtyInput: ({ context }) => {
      //   return !!context.prompt?.length;
      // },
      // hasPristineInput: ({ context }) => {
      //   return !context.prompt || !context.prompt.length;
      // },
      isMobile: () => {
        return isMobile();
      },
      isInputFocused: ({ event, ...props }) => {
        assert(event.type === "HYDRATE_INPUT", "expected HYDRATE_INPUT event");
        return event.ref === document.activeElement;
      },
    },
  }).createMachine(
    {
      id: "CraftMachine",
      context: initialContext,
      on: {
        // SKIP: {
        //   actions: assign({
        //     currentItemIndex: ({ context }) => context.currentItemIndex + 1,
        //   }),
        // },
      },
      type: "parallel",
      states: {
        // TokenState: {
        //   on: {
        //     CLEAR: {
        //       guard: ({ event }) => !!event.all,
        //       actions: assign({
        //         tokens: [],
        //       }),
        //     },
        //     REMOVE_TOKEN: {
        //       actions: assign({
        //         prompt: "",
        //         // currentItemIndex: 0,
        //         tokens: ({ context, event }) => [
        //           ...context.tokens.filter((token) => token !== event.token),
        //         ],
        //       }),
        //     },
        //     ADD_TOKEN: {
        //       actions: assign({
        //         tokens: ({ context, event }) => [
        //           ...context.tokens,
        //           event.token,
        //         ],
        //       }),
        //     },
        //   },
        // },
        Auth: {
          initial: !session ? "Anonymous" : "LoggedIn",
          on: {
            UPDATE_SESSION: {
              target: ".LoggedIn",
            },
          },
          states: {
            Anonymous: {
              on: {
                SAVE: {
                  target: "Registering",
                },
              },
            },
            Registering: {
              initial: "InputtingEmail",
              onDone: "LoggedIn",
              on: {
                CANCEL: "Anonymous",
              },
              states: {
                InputtingEmail: {
                  on: {
                    PAGE_LOADED: {
                      target: "InputtingOTP",
                      guard: ({ event }) => event.pathname === "/auth/passcode",
                      // actions: raise({ type: "CLOSE" }),
                      // actions: send({ type: "CLOSE" }),
                    },
                  },
                },
                InputtingOTP: {
                  on: {
                    PAGE_LOADED: {
                      target: "Complete",
                      guard: ({ event }) => event.pathname === "/me",
                    },
                  },
                },
                Complete: {
                  type: "final",
                },
              },
            },
            LoggedIn: {
              type: "parallel",
              states: {
                Saving: {
                  initial: "False",
                  on: {
                    SAVE: {
                      target: ".Showing",
                      actions: assign(({ context }) =>
                        produce(context, (draft) => {
                          const {
                            currentItemIndex,
                            suggestedRecipes,
                            recipes,
                          } = session$.get().context;
                          const recipeId = suggestedRecipes[currentItemIndex];
                          assert(recipeId, "expected recipeId when saving");
                          const recipe = recipes[recipeId];
                          assert(recipe, "expected recipe when saving");
                          assert(
                            recipe.slug,
                            "expected recipe slug when saving"
                          );
                          draft.savedRecipeSlugs.push(recipe.slug);
                        })
                      ),
                    },
                  },
                  states: {
                    False: {},
                    Showing: {
                      on: {
                        NEXT: "False",
                        PREV: "False",
                        SCROLL_INDEX: "False",
                        CLEAR: "False",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        // Creating: {
        //   initial: "False",
        //   states: {
        //     False: {
        //       on: {
        //         SAVE: "InProgress",
        //       },
        //     },
        //     InProgress: {
        //       invoke: {
        //         src: "waitForNewRecipeSlug",
        //         onDone: "Navigating",
        //       },
        //       after: {
        //         10000: "TimedOut",
        //       },
        //     },
        //     Navigating: {
        //       entry: ({ context }) => {
        //         const { createdRecipeSlugs } = session$.get().context;
        //         const slug = createdRecipeSlugs[createdRecipeSlugs.length - 1];
        //         assert(slug, "expected slug when navigating to new recipe");

        //         router.push(`/recipe/${slug}`);
        //       },
        //       after: {
        //         10000: "TimedOut",
        //       },
        //       on: {
        //         PAGE_LOADED: {
        //           target: "False",
        //           actions: [raise({ type: "CLOSE" })],
        //         },
        //       },
        //     },
        //     TimedOut: {},
        //   },
        // },
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
        Hydration: {
          initial: "Waiting",
          states: {
            Waiting: {
              on: {
                HYDRATE_INPUT: {
                  target: "Complete",
                  actions: [
                    // {
                    //   type: "assignPrompt",
                    //   params({ event }) {
                    //     return { prompt: event.ref.value };
                    //   },
                    // },
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
            Complete: {
              type: "final",
            },
          },
        },
        Prompt: {
          // initial: initialPromptState,
          on: {
            CLEAR: {
              actions: [
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
          // states: {
          //   Dirty: {
          //     entry: () => {
          //       document.body.classList.add("prompt-dirty");
          //       document.body.classList.remove("prompt-pristine");
          //     },
          //     always: {
          //       target: "Pristine",
          //       guard: ({ context }) =>
          //         !context.prompt || context.prompt === "",
          //     },
          //   },
          //   Pristine: {
          //     entry: () => {
          //       document.body.classList.remove("prompt-dirty");
          //       document.body.classList.add("prompt-pristine");
          //     },
          //     always: {
          //       target: "Dirty",
          //       guard: ({ context }) => !!context.prompt?.length,
          //     },
          //   },
          // },
        },
        Open: {
          initial: initialOpen,
          on: {
            SET_INPUT: {
              target: ".True",
              actions: [
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
          states: {
            True: {
              entry: [
                () => {
                  document.body.classList.add("crafting");
                  // setTimeout(() => {
                  //   window.scrollTo(0, 0);
                  // }, 200);
                },
                {
                  type: "replaceQueryParameters",
                  params({ event }) {
                    if (event.type === "SET_INPUT") {
                      const prompt = event.value ? { prompt: event.value } : {};
                      return {
                        paramSet: {
                          crafting: "1",
                          ...prompt,
                        },
                      };
                    }
                    return { paramSet: {} };
                  },
                },
                {
                  type: "focusInput",
                },
              ],
              on: {
                // BLUR_PROMPT: {
                //   target: "False",
                //   guard: ({ context }) => !(context.prompt?.length || 0),
                //   actions: [
                //     {
                //       type: "replaceQueryParameters",
                //       params() {
                //         return {
                //           paramSet: {
                //             crafting: undefined,
                //           },
                //         };
                //       },
                //     },
                //   ],
                // },
                TOGGLE: "False",
                // BACK: "False",
                CLOSE: "False",
                REMOVE_TOKEN: {
                  // todo, conditionally focus the input if there is no prompt
                },
                ADD_TOKEN: {
                  actions: [
                    // {
                    //   type: "assignPrompt",
                    //   params: ({ context, event }) => ({
                    //     prompt: "",
                    //   }),
                    // },
                    // {
                    //   type: "replaceQueryParameters",
                    //   params({ context, event }) {
                    //     return {
                    //       paramSet: {
                    //         prompt: appendValueWithComma(
                    //           context.prompt || "",
                    //           event.ingredient
                    //         ),
                    //       },
                    //     };
                    //   },
                    // },
                    {
                      type: "blurInput",
                    },
                  ],
                },
                KEY_DOWN: [
                  {
                    guard: ({ event, context }) => {
                      const didPressEnter = event.keyboardEvent.key === "Enter";
                      const prompt = session$.get().context.prompt;
                      return didPressEnter && !!prompt && !!prompt.length;
                    },
                    actions: [
                      ({ context, event }) => {
                        event.keyboardEvent.preventDefault();

                        const el = document.getElementById(
                          "prompt"
                        ) as HTMLTextAreaElement;

                        const token = el.value;
                        el.value = "";

                        // If we want events to go to the server,
                        // we have to use SEND rather than reply raise
                        // todo in future we might want to have events go to the server
                        // by listening to events that happen on the state machine
                        // rather than explicitly sending up events send through useSend
                        send({
                          type: "ADD_TOKEN",
                          token,
                        });
                      },
                    ],
                  },
                  {
                    actions: [
                      // assign({
                      //   currentItemIndex: ({ context, event }) => {
                      //     const { key, ctrlKey, shiftKey } =
                      //       event.keyboardEvent;
                      //     const { currentItemIndex } = context;
                      //     const latestDescriptionLength =
                      //       context.suggestions?.[context.suggestions.length]
                      //         ?.description?.length || 0;
                      //     const maxItemIndex = 7;
                      //     // const maxItemIndex = !context.instantRecipeMetadata
                      //     //   ? 0
                      //     //   : context.suggestions?.length
                      //     //   ? latestDescriptionLength > 10
                      //     //     ? context.suggestions.length + 1
                      //     //     : context.suggestions?.length
                      //     //     ? context.suggestions.length
                      //     //     : 1
                      //     //   : 0;
                      //     let nextItemIndex =
                      //       typeof currentItemIndex !== "undefined"
                      //         ? currentItemIndex
                      //         : -1;
                      //     switch (key) {
                      //       case "n":
                      //       case "j": {
                      //         // vim keybind down
                      //         if (ctrlKey) {
                      //           nextItemIndex = nextItemIndex + 1;
                      //         }
                      //         break;
                      //       }
                      //       case "ArrowDown": {
                      //         nextItemIndex = nextItemIndex + 1;
                      //         break;
                      //       }
                      //       case "p":
                      //       case "k": {
                      //         // vim keybind up
                      //         if (ctrlKey) {
                      //           nextItemIndex = nextItemIndex - 1;
                      //         }
                      //         break;
                      //       }
                      //       case "ArrowUp": {
                      //         nextItemIndex = nextItemIndex - 1;
                      //         break;
                      //       }
                      //     }
                      //     if (nextItemIndex < 0) {
                      //       return 0;
                      //     }
                      //     if (nextItemIndex > maxItemIndex) {
                      //       nextItemIndex = maxItemIndex;
                      //     }
                      //     const el = document.querySelector(
                      //       `#result-${nextItemIndex}`
                      //     );
                      //     if (!el) {
                      //       // element must have unmounted, no longer selectable
                      //       return 0;
                      //     }
                      //     // Scroll the element into view
                      //     el.scrollIntoView();
                      //     // Wait for the next repaint to ensure the scrolling has finished
                      //     requestAnimationFrame(() => {
                      //       const elementRect = el.getBoundingClientRect();
                      //       const absoluteElementTop =
                      //         elementRect.top + window.pageYOffset;
                      //       const middle =
                      //         absoluteElementTop - window.innerHeight / 2;
                      //       window.scrollTo(0, middle);
                      //     });
                      //     return nextItemIndex;
                      //   },
                      // }),
                    ],
                  },
                ],
                // UPDATE_SEARCH_PARAMS: {
                //   guard: ({ event }) => event.searchParams["crafting"] !== "1",
                //   target: "False",
                // },

                PAGE_LOADED: {
                  target: "False",
                },
              },
            },
            False: {
              entry: [
                () => {
                  document.body.classList.remove("crafting");
                  // const prompt = document.querySelector(
                  //   "#prompt"
                  // ) as HTMLTextAreaElement | null;
                  // if (prompt) {
                  //   prompt.blur();
                  // }
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
                // assign({
                //   currentItemIndex: () => {
                //     return 0;
                //   },
                // }),
              ],
              on: {
                // UPDATE_SEARCH_PARAMS: {
                //   target: "True",
                //   guard: ({ event }) => {
                //     return event.searchParams["crafting"] === "1";
                //   },
                //   actions: assign({
                //     prompt: ({ event }) => event.searchParams["prompt"],
                //   }),
                // },
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
                  actions: [
                    // {
                    //   type: "assignPrompt",
                    //   params({ event }) {
                    //     return { prompt: event.prompt };
                    //   },
                    // },
                    // {
                    //   type: "assignTokens",
                    //   params({ event }) {
                    //     return { tokens: event.tokens || [] };
                    //   },
                    // },
                    {
                      type: "replaceQueryParameters",
                      params({ event }) {
                        return {
                          paramSet: {
                            prompt: event.prompt,
                          },
                        };
                      },
                    },
                    // assign({
                    //   currentItemIndex: 0,
                    // }),
                  ],
                },
                HYDRATE_INPUT: {
                  target: "True",
                  guard: and(["isInputFocused", "isMobile"]),
                },
              },
            },
          },
        },
        Carousel: {
          on: {
            PREV: {
              actions: assign({
                scrollItemIndex: ({ context }) => context.scrollItemIndex - 1,
              }),
            },
            NEXT: {
              actions: assign({
                scrollItemIndex: ({ context }) => context.scrollItemIndex + 1,
              }),
            },
            SCROLL_INDEX: {
              actions: assign({
                scrollItemIndex: ({ event }) => event.index,
              }),
            },
          },
        },
      },
    }
    // {
    //   actions: {
    //   },
    // }
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
