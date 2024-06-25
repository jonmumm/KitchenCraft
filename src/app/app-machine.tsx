import { GeneratorObervableEvent } from "@/lib/generator";
import { arraysEqual, assert, isMobile, sentenceToSlug } from "@/lib/utils";
import {
  AppEvent,
  InstantRecipeMetadataPredictionOutput,
  SuggestionPredictionOutput,
} from "@/types";
import { ReadableAtom } from "nanostores";
import { Session } from "next-auth";
// import { parseAsString } from "next-usequerystate";
import { selectFeedItemIds } from "@/selectors/page-session.selectors";
import { socket$ } from "@/stores/socket";
import { produce } from "immer";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";
import {
  ActorRefFrom,
  SnapshotFrom,
  StateValueFrom,
  and,
  assertEvent,
  assign,
  fromPromise,
  matchesState,
  not,
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
    let prompt = searchParams["prompt"] || "";
    console.log({ prompt });
    console.log({ prompt });
    console.log({ prompt });

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
    console.log({ prompt });

    // const ingredients =
    //   searchParams["ingredients"] &&
    //   ingredientsParser.parseServerSide(searchParams["ingredients"]);
    // const tags =
    //   searchParams["tags"] && tagsParser.parseServerSide(searchParams["tags"]);

    return {
      prompt,
      submittedPrompt: "",
      ingredients: undefined,
      tags: undefined,
      suggestions: null,
      focusedRecipeId: undefined,
      substitutions: undefined,
      dietaryAlternatives: undefined,
      savedRecipeSlugs: [],
      equipmentAdaptations: undefined,
      inputs: {},
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
        _,
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
        window.history.pushState({}, "", newUrl);
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
      didSubmitPrompt: ({ event }) => {
        assertEvent(event, "KEY_DOWN");
        const didPressEnter = event.keyboardEvent.key === "Enter";
        const prompt = store.get().context.prompt;
        return didPressEnter && !!prompt && !!prompt.length;
      },
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
      hasFocusedRecipeQueryParam: () => {
        console.log("has focused check");
        const focusedRecipeId = new URLSearchParams(window.location.search).get(
          "focusedRecipeId"
        );
        console.log({ focusedRecipeId });
        return focusedRecipeId ? focusedRecipeId.length > 0 : false;
      },
      hasCraftingQueryParam: () => {
        return (
          new URLSearchParams(window.location.search).get("crafting") === "1"
        );
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
              prompt: ({ event }) => event.value.trim(),
            }),
          },
          NEW_RECIPE: {
            guard: ({ event }) => event.prompt !== undefined,
            actions: assign({
              prompt: ({ event }) => event.prompt!,
            }),
          },
          ADD_TOKEN: {
            actions: [
              assign({
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
              assign({
                submittedPrompt: ({ context }) => context.prompt,
              }),
              {
                type: "pushQueryParameters",
                params: ({ context }) => {
                  return {
                    paramSet: {
                      prompt: context.prompt,
                    },
                  };
                },
              },
            ],
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
                submittedPrompt: "",
              }),
              {
                type: "pushQueryParameters",
                params: {
                  paramSet: {
                    prompt: undefined,
                  },
                },
              },
            ],
          },
          POP_STATE: {
            actions: [
              assign({
                prompt: () => {
                  const prompt = new URLSearchParams(
                    window.location.search
                  ).get("prompt");
                  return prompt || "";
                },
              }),
              assign({
                submittedPrompt: ({ context }) => context.prompt,
              }),
              ({ context }) => {
                const promptEl = document.body.querySelector("#prompt") as
                  | HTMLTextAreaElement
                  | undefined;
                if (promptEl) {
                  promptEl.value = context.prompt;
                }
              },
            ],
          },
          // UPDATE_SEARCH_PARAMS: [
          //   {
          //     target: ".Open.True",
          //     guard: ({ event }) => !!event.hash.length,
          //     actions: assign({
          //       currentListSlug: ({ event }) =>
          //         event.hash.length ? event.hash.slice(1) : undefined,
          //     }),
          //   },
          //   {
          //     target: ".Open.False",
          //     actions: assign({
          //       currentListSlug: () => {
          //         return undefined;
          //       },
          //     }),
          //   },
          // ],
        },
      },
      Open: {
        initial: initialOpen,
        on: {
          UPDATE_SEARCH_PARAMS: [
            {
              target: ".False",
              guard: not("hasCraftingQueryParam"),
            },
            {
              target: ".True",
              guard: "hasCraftingQueryParam",
            },
          ],
          POP_STATE: [
            {
              target: ".False",
              guard: not("hasCraftingQueryParam"),
            },
            {
              target: ".True",
              guard: "hasCraftingQueryParam",
            },
          ],
        },
        states: {
          False: {
            entry: [
              () => {
                document.body.classList.remove("crafting");
              },
            ],
            on: {
              // TOGGLE: {
              //   target: "True",
              // },
              FOCUS_PROMPT: {
                target: "True",
                actions: {
                  type: "pushQueryParameters",
                  params: {
                    paramSet: {
                      crafting: "1",
                    },
                  },
                },
              },
              SET_INPUT: {
                target: "True",
                actions: {
                  type: "pushQueryParameters",
                  params: {
                    paramSet: {
                      crafting: "1",
                    },
                  },
                },
              },
              NEW_RECIPE: {
                target: "True",
                actions: {
                  type: "pushQueryParameters",
                  params: {
                    paramSet: {
                      crafting: "1",
                    },
                  },
                },
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
              // TOGGLE: "False",
              // SHARE_SELECTED: "False",
              // SAVE_SELECTED: "False",
              SUBMIT: {
                actions: [
                  {
                    type: "pushQueryParameters",
                    params: ({ context }) => {
                      return {
                        paramSet: {
                          prompt: context.prompt,
                        },
                      };
                    },
                  },
                  assign({
                    submittedPrompt: ({ context }) => context.prompt,
                  }),
                  "blurInput",
                ],
              },
            },
          },
        },
      },
      MyRecipes: {
        type: "parallel",
        on: {
          HASH_CHANGE: [
            {
              target: ".Open.True",
              guard: ({ event }) => !!event.hash.length,
              actions: assign({
                currentListSlug: ({ event }) =>
                  event.hash.length ? event.hash.slice(1) : undefined,
              }),
            },
            {
              target: ".Open.False",
              actions: assign({
                currentListSlug: () => {
                  return undefined;
                },
              }),
            },
          ],
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
                always: {
                  target: "False",
                  guard: () => {
                    return window.location.hash.length === 0;
                  },
                },
                on: {
                  SAVE_SELECTED: "False",
                  NEW_RECIPE: "False",
                  EXIT: "False",
                  SHARE_SELECTED: "False",
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
                actions: [
                  assign({
                    focusedRecipeId: ({ event }) => event.id,
                  }),
                  {
                    type: "pushQueryParameters",
                    params({ event }) {
                      const recipe = store.get().context.recipes[event.id];
                      return {
                        paramSet: {
                          focusedRecipeId: event.id,
                        },
                      };
                    },
                  },
                ],
              },
            },
          },
          Open: {
            on: {
              UPDATE_SEARCH_PARAMS: {
                target: "Closed",
                guard: not("hasFocusedRecipeQueryParam"),
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
              if (self.getSnapshot().matches({ MyRecipes: { Open: "True" } })) {
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
                  SAVE_SELECTED: "True",
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
            on: {
              CHANGE: {
                guard: ({ event }) => event.name === "listName",
                actions: assign({
                  inputs: ({ context, event }) =>
                    produce(context.inputs, (draft) => {
                      draft.listName = event.value;
                    }),
                }),
              },
              SUBMIT: {
                guard: ({ event }) => event.name === "listName",
                actions: ({ context }) => {
                  const listName = context.inputs.listName;
                  assert(
                    listName,
                    "expected listName after submitting toc reate recipe"
                  );
                  router.push(`#${sentenceToSlug(listName)}`);
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
                  CLOSE: "False",
                  // SHARE_PRESS: "False",
                  SHARE_PRESS: {
                    target: "False",
                    guard: () => "share" in navigator,
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
