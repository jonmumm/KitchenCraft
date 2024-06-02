import { GeneratorObervableEvent } from "@/lib/generator";
import { assert, isMobile } from "@/lib/utils";
import {
  AppEvent,
  InstantRecipeMetadataPredictionOutput,
  SuggestionPredictionOutput,
  SuggestionsInput,
} from "@/types";
import { ReadableAtom } from "nanostores";
import { Session } from "next-auth";
// import { parseAsString } from "next-usequerystate";
import { Badge } from "@/components/display/badge";
import { Card } from "@/components/display/card";
import { useSend } from "@/hooks/useSend";
import { socket$ } from "@/stores/socket";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";
import {
  ActorRefFrom,
  SnapshotFrom,
  and,
  assign,
  fromPromise,
  setup,
} from "xstate";
import { z } from "zod";
import { AppContextSchema } from "./@craft/schemas";
import { PageSessionSnapshot } from "./page-session-machine";

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

export const createAppMachine = ({
  searchParams,
  router,
  initialPath,
  send,
  session,
  store,
  token,
}: {
  searchParams: Record<string, string>;
  router: AppRouterInstance;
  initialPath: string;
  send: (event: AppEvent) => void;
  session: Session | null;
  store: ReadableAtom<PageSessionSnapshot>;
  token: string;
}) => {
  const initialOpen =
    searchParams["crafting"] === "1" ||
    (typeof document !== "undefined" &&
      document.body.classList.contains("crafting"))
      ? "True"
      : "False";

  const initialContext = (() => {
    // let prompt = parseAsString.parseServerSide(searchParams["prompt"]);
    let prompt = ""; // todo parse;

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

    // const ingredients =
    //   searchParams["ingredients"] &&
    //   ingredientsParser.parseServerSide(searchParams["ingredients"]);
    // const tags =
    //   searchParams["tags"] && tagsParser.parseServerSide(searchParams["tags"]);

    return {
      prompt,
      ingredients: undefined,
      tags: undefined,
      suggestions: null,
      focusedRecipeId: undefined,
      substitutions: undefined,
      dietaryAlternatives: undefined,
      savedRecipeSlugs: [],
      equipmentAdaptations: undefined,
      currentRecipeUrl: undefined,
      scrollItemIndex: 0,
      token,
    } satisfies AppContext;
  })();

  // const initialPromptState = store.get().context.prompt?.length
  //   ? "Dirty"
  //   : "Pristine";

  const waitForSessionValue = fromPromise(
    async ({
      input,
    }: {
      input: {
        selector: (snapshot: PageSessionSnapshot) => boolean;
        timeoutMs: number;
      };
    }) => {
      return new Promise<void>((resolve, reject) => {
        const snapshot = store.get();
        const { selector } = input;

        const value = selector(snapshot);
        if (value) {
          resolve();
        }
        let returned = false;

        setTimeout(() => {
          if (!returned) {
            reject();
            returned = true;
          }
        }, input.timeoutMs);

        const unsub = store.subscribe((snapshot) => {
          const value = selector(snapshot);
          if (value) {
            returned = true;
            resolve();
            unsub();
          }
        });
      });
      // store.subscribe(input.selector, () => {

      // })
      // store
    }
  );

  return setup({
    types: {
      context: {} as AppContext,
      events: {} as AppEvent | GeneratorEvent,
    },
    actions: {
      // shareSelectedUrl: ({ context }) => {

      // },
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
        assert(element, "expected prompt element");

        // Check if the element is already in focus
        if (document.activeElement !== element) {
          if (element.value.length) {
            element.selectionStart = element.selectionEnd =
              element.value.length;
          }
          element.focus();
        }
      },
    },
    actors: {
      waitForSessionValue,
      // createNewInstantRecipe,
      // createNewRecipeFromSuggestion,
      // waitForNewRecipeSlug: fromPromise(
      //   () =>
      //     new Promise((resolve) => {
      //       const initialNumSlugs =
      //         store.get().context.createdRecipeSlugs.length;
      //       // todo: timeout?
      //       const unsub = store.listen((state) => {
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
      hasValidChefName: ({ context }) => {
        const stateValue = store.get().value;
        return (
          typeof stateValue.Profile &&
          !!stateValue.Profile.Available &&
          stateValue.Profile.Available === "Yes"
        );
      },
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
        // Sharing: {
        //   initial: "Idle",
        //   states: {
        //     Idle: {
        //       on: {
        //         SHARE_SELECTED: [
        //           {
        //             target: "InProgress",
        //             guard: () => "share" in navigator,
        //           },
        //           {
        //             target: "Copied",
        //             guard: () => "clipboard" in navigator,
        //             actions: "shareSelectedUrl"
        //           },
        //         ],
        //       },
        //     },
        //     InProgress: {},
        //     Copied: {
        //       always: {
        //         target: "Idle",
        //       },
        //     },
        //     Complete: {},
        //     Error: {
        //       always: {
        //         target: "Idle",
        //         actions: console.error,
        //       },
        //     },
        //   },
        // },
        Socket: {
          initial: "Uninitialized",
          on: {
            SOCKET_ERROR: ".Error",
            SOCKET_CLOSE: ".Closed",
            SOCKET_OPEN: ".Open",
            SOCKET_CONNECTING: ".Connecting",
          },
          states: {
            Uninitialized: {},
            Connecting: {},
            Open: {
              entry: assign({
                socketToastId: ({ context }) => {
                  if (context.socketToastId) {
                    toast.dismiss(context.socketToastId);
                  }
                  return undefined;
                },
              }),
            },
            Closed: {
              entry: assign({
                socketToastId: ({ context }) => {
                  if (context.socketToastId) {
                    toast.dismiss(context.socketToastId);
                  }
                  return toast.warning("Connection closed. Press to reload", {
                    dismissible: false,
                    action: {
                      label: "Reload",
                      onClick: () => window.location.reload(),
                    },
                  });
                },
              }),
              on: {
                VISIBILITY_CHANGE: {
                  actions: ({ event }) => {
                    if (event.visibilityState === "visible") {
                      const socket = socket$.get();
                      assert(socket, "expected socket on visibility change");
                      socket.reconnect();
                    }
                  },
                },
              },
            },
            Error: {
              entry: assign({
                socketToastId: ({ context }) => {
                  if (context.socketToastId) {
                    toast.dismiss(context.socketToastId);
                  }
                  return toast.error(
                    "There was an error with the connection.",
                    {
                      dismissible: false,
                      action: {
                        label: "Reload",
                        onClick: () => window.location.reload(),
                      },
                    }
                  );
                },
              }),
            },
          },
        },
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
                      target: "InputtingChefName",
                    },
                  },
                },
                InputtingChefName: {
                  on: {
                    SUBMIT: {
                      target: "InputtingOTP",
                      guard: "hasValidChefName",
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
            LoggedIn: {},
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
        Input: {
          on: {
            SET_INPUT: {
              actions: assign({
                prompt: ({ event }) => event.value,
              }),
            },
            ADD_TOKEN: {
              actions: assign({
                prompt: ({ context, event }) => {
                  const currentValue = context.prompt;

                  let nextValue;
                  if (currentValue.length) {
                    nextValue = currentValue + `, ${event.token}`;
                  } else {
                    nextValue = event.token;
                  }
                  return nextValue;
                },
              }),
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
                    // {
                    //   type: "replaceQueryParameters",
                    //   params({ event }) {
                    //     return {
                    //       paramSet: {
                    //         prompt: event.ref.value,
                    //       },
                    //     };
                    //   },
                    // },
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
                assign({
                  prompt: "",
                }),
              ],
            },
          },
        },
        Open: {
          initial: initialOpen,
          on: {
            ADD_TOKEN: ".True",
            SET_INPUT: {
              target: ".True",
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
                // {
                //   type: "replaceQueryParameters",
                //   params({ event }) {
                //     if (event.type === "SET_INPUT") {
                //       const prompt = event.value ? { prompt: event.value } : {};
                //       return {
                //         paramSet: {
                //           crafting: "1",
                //           ...prompt,
                //         },
                //       };
                //     }
                //     return { paramSet: {} };
                //   },
                // },
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
                      const prompt = store.get().context.prompt;
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
                // {
                //   type: "replaceQueryParameters",
                //   params() {
                //     return {
                //       paramSet: {
                //         crafting: undefined,
                //       },
                //     };
                //   },
                // },
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
                    // {
                    //   type: "replaceQueryParameters",
                    //   params({ event }) {
                    //     return {
                    //       paramSet: {
                    //         prompt: event.prompt,
                    //       },
                    //     };
                    //   },
                    // },
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
        MyRecipes: {
          type: "parallel",
          on: {
            MOUNT_CAROUSEL: {
              actions: [
                assign({
                  carouselAPI: ({ event }) => event.carouselAPI,
                  selectItemIndexToScrollTo: ({ context, event }) => {
                    console.log(context.selectItemIndexToScrollTo, event);
                    if (
                      context.selectItemIndexToScrollTo !== undefined &&
                      event.carouselAPI
                    ) {
                      event.carouselAPI.scrollTo(
                        context.selectItemIndexToScrollTo
                      );
                    }
                    return undefined;
                  },
                }),
              ],
            },
            PREV: {
              actions: ({ context }) => {
                if (context.carouselAPI) {
                  context.carouselAPI.scrollPrev();
                }
              },
            },
            NEXT: {
              actions: ({ context }) => {
                if (context.carouselAPI) {
                  context.carouselAPI.scrollNext();
                }
              },
            },
          },
          states: {
            Open: {
              initial: "False",
              states: {
                False: {
                  on: {
                    VIEW_LIST: [
                      {
                        target: "True",
                        guard: ({ context, event }) => {
                          return !!event.itemIndex;
                        },
                        actions: assign({
                          selectItemIndexToScrollTo: ({ event }) =>
                            event.itemIndex,
                        }),
                      },
                      { target: "True" },
                    ],
                  },
                },
                True: {
                  on: {
                    NEW_RECIPE: "False",
                    EXIT: "False",
                  },
                },
              },
            },
          },
        },
        RecipeDetail: {
          initial: "Closed",
          states: {
            Closed: {
              on: {
                VIEW_RECIPE: {
                  target: "Open",
                  actions: assign({
                    focusedRecipeId: ({ event }) => event.id,
                  }),
                },
              },
            },
            Open: {
              on: {
                EXIT: {
                  target: "Closed",
                  actions: assign({
                    focusedRecipeId: () => undefined,
                  }),
                },
              },
            },
          },
        },
        PersonalizationSettings: {
          initial: "Closed",
          states: {
            Closed: {
              on: {
                OPEN_SETTINGS: "Open",
              },
            },
            Open: {
              on: {
                CLOSE: "Closed",
              },
            },
          },
        },
        Selection: {
          on: {
            SELECT_RECIPE: {
              actions: ({ event }) => {
                const recipe = store.get().context.recipes[event.id];
                const name = recipe?.name;
                assert(name, "expected to find recipe.name");
                const { browserSessionSnapshot } = store.get().context;
                assert(
                  browserSessionSnapshot,
                  "expected browser session snapshot"
                );

                toast.custom((t) => (
                  <RecipeAddedToast
                    name={name}
                    toastId={t}
                    itemIndex={
                      browserSessionSnapshot.context.selectedRecipeIds.length
                    }
                  />
                ));
              },
            },
            SELECT_RECIPE_SUGGESTION: {
              actions: ({ context, event, self }) => {
                console.log(self.getSnapshot());
                const { browserSessionSnapshot } = store.get().context;
                assert(
                  browserSessionSnapshot,
                  "expected browser session snapshot"
                );
                const feedItemId =
                  browserSessionSnapshot.context.feedItemIds[event.itemIndex];
                assert(feedItemId, "couldnt find feed item id");
                const feedItem =
                  browserSessionSnapshot.context.feedItems[feedItemId];
                assert(feedItem, "expected feedItem");
                assert(feedItem.category, "expected feedItem to have cateogry");
                assert(feedItem.recipes, "expected feedItem to have recipes");
                const recipe = feedItem.recipes[event.recipeIndex];
                assert(recipe, "expected to find recipe in feedItem");
                assert(recipe.id, "expected to find recipe.id");
                const name = recipe.name;
                assert(name, "expected to find recipe.name");

                toast.custom((t) => (
                  <RecipeAddedToast
                    name={name}
                    toastId={t}
                    itemIndex={
                      browserSessionSnapshot.context.selectedRecipeIds.length
                    }
                  />
                ));
              },
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

const RecipeAddedToast = ({
  name,
  toastId,
  itemIndex,
}: {
  name: string;
  toastId: string | number;
  itemIndex: number;
}) => {
  const send = useSend();
  return (
    <Card className="flex flex-row gap-2 justify-between items-center w-full p-4 shadow-xl">
      <div className="flex flex-col gap-1 flex-1 w-full">
        <div className="font-semibold">{name}</div>
        <div className="text-muted-foreground">Added to Selected</div>
      </div>
      <div className="flex items-center justify-center">
        <Badge
          onClick={() => {
            toast.dismiss(toastId);
            send({ type: "VIEW_LIST", itemIndex });
          }}
        >
          View
        </Badge>
      </div>
    </Card>
  );
};

type AppAMchine = ReturnType<typeof createAppMachine>;
export type AppActor = ActorRefFrom<AppAMchine>;
export type AppSnapshot = SnapshotFrom<AppActor>;
type AppContext = z.infer<typeof AppContextSchema>;

type GeneratorEvent =
  | GeneratorObervableEvent<"SUGGESTION", SuggestionPredictionOutput>
  | GeneratorObervableEvent<"REMIX_SUGGESTIONS", SuggestionPredictionOutput>
  | GeneratorObervableEvent<
      "INSTANT_RECIPE_METADATA",
      InstantRecipeMetadataPredictionOutput
    >;
