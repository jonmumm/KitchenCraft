import { GeneratorObervableEvent } from "@/lib/generator";
import { arraysEqual, assert, isMobile } from "@/lib/utils";
import {
  AppEvent,
  InstantRecipeMetadataPredictionOutput,
  SuggestionPredictionOutput
} from "@/types";
import { ReadableAtom } from "nanostores";
import { Session } from "next-auth";
// import { parseAsString } from "next-usequerystate";
import { selectFeedItemIds } from "@/selectors/page-session.selectors";
import { socket$ } from "@/stores/socket";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";
import {
  ActorRefFrom,
  SnapshotFrom,
  StateValueFrom,
  and,
  assign,
  fromPromise,
  matchesState,
  setup,
} from "xstate";
import { z } from "zod";
import { AppContextSchema } from "./@craft/schemas";
import type { PageSessionSnapshot } from "./page-session-machine";
import { RecipeAddedToast } from "./recipe-added-toast";

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
      // replaceQueryParameters: (
      //   { context },
      //   params: { paramSet: Record<string, string | undefined> }
      // ) => {
      //   const queryParams = new URLSearchParams(window.location.search);

      //   for (const key in params.paramSet) {
      //     const value = params.paramSet[key];
      //     if (!!value) {
      //       queryParams.set(key, value);
      //     } else {
      //       queryParams.delete(key);
      //     }
      //   }

      //   const paramString = queryParams.toString();

      //   // Include the location hash in the new URL
      //   const hash = window.location.hash;

      //   // Construct the new URL with the hash
      //   const newUrl =
      //     window.location.pathname +
      //     (paramString !== "" ? "?" + paramString : "") +
      //     hash;
      //   window.history.replaceState(context, "", newUrl);
      // },
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
      waitForRefreshFeedEnd: fromPromise(async () => {
        const feedItems = selectFeedItemIds(store.get());
        const startingLength = feedItems.length;

        await new Promise<null>((resolve, reject) => {
          // todo add a timeout
          // setTimeout(() => {

          // }, )
          const unsub = store.listen((snapshot) => {
            const newFeedItems = selectFeedItemIds(snapshot);
            if (
              !arraysEqual(newFeedItems, feedItems) &&
              startingLength === newFeedItems.length
            ) {
              resolve(null);
              unsub();
            }
          });
        });

        return true;
      }),
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
      hasValidChefName: () => {
        const stateValue = store.get().value;
        // todo there is a latency issue here whe if user presses submit before value has been synced
        return matchesState({ Profile: { Available: "Yes" } }, stateValue);
      },
      isMobile: () => {
        return isMobile();
      },
      isInputFocused: ({ event, ...props }) => {
        assert(event.type === "HYDRATE_INPUT", "expected HYDRATE_INPUT event");
        return event.ref === document.activeElement;
      },
    },
  }).createMachine({
    id: "CraftMachine",
    context: initialContext,
    type: "parallel",
    states: {
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
                return toast.error("There was an error with the connection.", {
                  dismissible: false,
                  action: {
                    label: "Reload",
                    onClick: () => window.location.reload(),
                  },
                });
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
          LOGOUT: {
            actions: () => {
              window.location.href = "/signout";
            },
          },
        },
        states: {
          Anonymous: {
            on: {
              SAVE: {
                target: "Registering",
              },
              SIGN_IN: {
                target: "SigningIn",
              },
            },
          },
          SigningIn: {
            on: {
              CANCEL: "Anonymous",
            },
            initial: "Inputting",
            states: {
              Inputting: {
                on: {
                  SUBMIT: "WaitingForClick",
                  CHANGE: {
                    guard: ({ event }) => event.name === "email",
                    actions: assign({
                      email: ({ event }) => event.value,
                    }),
                  },
                },
              },
              WaitingForClick: {
                invoke: {
                  src: "waitForSessionValue",
                  input: ({ context, event }) => {
                    return {
                      timeoutMs: 60000,
                      selector: (state) => {
                        return !!state.context.sessionSnapshot?.context
                          .authenticated;
                      },
                    };
                  },
                },
              },
              Clicked: {},
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
          NEW_RECIPE: {
            guard: ({ event }) => event.prompt !== undefined,
            actions: assign({
              prompt: ({ event }) => event.prompt!,
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
          NEW_RECIPE: {
            target: ".True",
          },
        },
        states: {
          False: {
            entry: [
              () => {
                document.body.classList.remove("crafting");
              },
            ],
            on: {
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
          True: {
            entry: [
              () => {
                document.body.classList.add("crafting");
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
              //     return { paramSet: {
              //       crafting: "1"
              //     } };
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
        },
      },
      MyCookbook: {
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
                  ADD_SELECTED: "False",
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
              VIEW_LIST: "Closed",
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
            actions: ({ event, self }) => {
              if (
                self.getSnapshot().matches({ MyCookbook: { Open: "True" } })
              ) {
                return;
              }
              const recipe = store.get().context.recipes[event.id];
              const name = recipe?.name;
              assert(name, "expected to find recipe.name");
              const { sessionSnapshot } = store.get().context;
              assert(sessionSnapshot, "expected browser session snapshot");

              toast.custom(
                (t) => (
                  <RecipeAddedToast
                    name={name}
                    toastId={t}
                    itemIndex={
                      sessionSnapshot.context.selectedRecipeIds?.length || 0
                    }
                  />
                ),
                { position: "top-right" }
              );
            },
          },
          SELECT_RECIPE_SUGGESTION: {
            actions: ({ context, event, self }) => {
              const { sessionSnapshot } = store.get().context;
              assert(sessionSnapshot, "expected browser session snapshot");
              const feedItemId =
                sessionSnapshot.context.feedItemIds[event.itemIndex];
              assert(feedItemId, "couldnt find feed item id");
              const feedItem =
                sessionSnapshot.context.feedItemsById[feedItemId];
              assert(feedItem, "expected feedItem");
              assert(feedItem.category, "expected feedItem to have cateogry");
              assert(feedItem.recipes, "expected feedItem to have recipes");
              const recipe = feedItem.recipes[event.recipeIndex];
              assert(recipe, "expected to find recipe in feedItem");
              assert(recipe.id, "expected to find recipe.id");
              const name = recipe.name;
              assert(name, "expected to find recipe.name");

              if (self.getSnapshot().matches({ Selection: "" })) {
              }

              toast.custom(
                (t) => (
                  <RecipeAddedToast
                    name={name}
                    toastId={t}
                    itemIndex={
                      sessionSnapshot.context.selectedRecipeIds?.length || 0
                    }
                  />
                ),
                { position: "top-center" }
              );
            },
          },
        },
      },
      Feed: {
        type: "parallel",
        states: {
          Refreshing: {
            initial: "False",
            states: {
              False: {
                on: {
                  REFRESH_FEED: "True",
                },
              },
              True: {
                invoke: {
                  src: "waitForRefreshFeedEnd",
                  onDone: "False",
                },
              },
            },
          },
        },
      },
      Lists: {
        type: "parallel",
        states: {
          Selecting: {
            initial: "False",
            states: {
              False: {
                on: {
                  ADD_SELECTED: "True",
                },
              },
              True: {
                on: {
                  CANCEL: "False",
                  SELECT_LIST: "False",
                  SUBMIT: "False",
                },
                // type: "parallel",
                // states: {
                //   Creating: {
                //     initial: "False",
                //     states: {
                //       False: {
                //         on: {
                //           CREATE_LIST: "True",
                //         },
                //       },
                //       True: {
                //         on: {
                //           CANCEL: "False",
                //         },
                //       },
                //     },
                //   },
                // },
              },
            },
          },
          Creating: {
            initial: "False",
            states: {
              False: {
                on: {
                  CREATE_LIST: "True",
                },
              },
              True: {
                on: {
                  CANCEL: "False",
                },
              },
            },
          },
        },
      },
      Share: {
        type: "parallel",
        states: {
          Open: {
            initial: "False",
            states: {
              False: {
                on: {
                  SHARE_SELECTED: "True",
                },
              },
              True: {
                on: {
                  CANCEL: "False",
                  SHARE_PRESS: "False",
                },
                onDone: "False",
                initial: "Idle",
                states: {
                  Idle: {
                    on: {
                      COPY_LINK: "Closing",
                    },
                  },
                  Closing: {
                    after: {
                      3000: "Closed",
                    },
                  },
                  Closed: {
                    type: "final",
                  },
                },
              },
            },
          },
        },
      },
    },
  });
};

type AppMachine = ReturnType<typeof createAppMachine>;
export type AppActor = ActorRefFrom<AppMachine>;
export type AppSnapshot = SnapshotFrom<AppActor>;
export type AppState = StateValueFrom<AppMachine>;
type AppContext = z.infer<typeof AppContextSchema>;

type GeneratorEvent =
  | GeneratorObervableEvent<"SUGGESTION", SuggestionPredictionOutput>
  | GeneratorObervableEvent<"REMIX_SUGGESTIONS", SuggestionPredictionOutput>
  | GeneratorObervableEvent<
      "INSTANT_RECIPE_METADATA",
      InstantRecipeMetadataPredictionOutput
    >;
