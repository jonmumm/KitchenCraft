import { captureEvent } from "@/actions/capturePostHogEvent";
import { getPersonalizationContext, getTimeContext } from "@/lib/llmContext";
import { streamToObservable } from "@/lib/stream-to-observable";
import { assert } from "@/lib/utils";
import { BrowserSessionContext, BrowserSessionEvent } from "@/types";
import { randomUUID } from "crypto";
import { produce } from "immer";
import { from, switchMap } from "rxjs";
import { assign, fromEventObservable, fromPromise, setup } from "xstate";
import { z } from "zod";
import { HomepageCategoriesStream } from "./homepage-categories.stream";
import {
  SuggestIngredientStream,
  SuggestIngredientsOutputSchema,
} from "./suggest-ingredients.stream";
import { SuggestPlaceholderStream } from "./suggest-placeholder.stream";
import {
  SuggestTagsOutputSchema,
  SuggestTagsStream,
} from "./suggest-tags.stream";
import { SuggestTokensStream } from "./suggest-tokens.stream";

const InputSchema = z.object({
  id: z.string(),
  userId: z.string(),
});
type Input = z.infer<typeof InputSchema>;

export const browserSessionMachine = setup({
  types: {
    input: {} as Input,
    context: {} as BrowserSessionContext,
    events: {} as BrowserSessionEvent,
  },
  actors: {
    createNewListWithRecipeId: fromPromise(
      async ({ input }: { input: { listId: string; recipeId: string } }) => {
        console.log(input);
        return "";
      }
    ),
    generateHomepageFeed: fromEventObservable(
      ({
        input,
      }: {
        input: {
          personalizationContext: string;
          timeContext: string;
        };
      }) => new HomepageCategoriesStream().getObservable(input)
    ),
    generatePlaceholders: fromEventObservable(
      ({
        input,
      }: {
        input: {
          personalizationContext: string;
          timeContext: string;
        };
      }) => new SuggestPlaceholderStream().getObservable(input)
    ),
    generateTokenSuggestions: fromEventObservable(
      ({
        input,
      }: {
        input: {
          personalizationContext: string;
          timeContext: string;
        };
      }) => new SuggestTokensStream().getObservable(input)
    ),
    generateTagSuggestions: fromEventObservable(
      ({
        input,
      }: {
        input: {
          personalizationContext: string;
          timeContext: string;
        };
      }) => {
        const tokenStream = new SuggestTagsStream();
        return from(tokenStream.getStream(input)).pipe(
          switchMap((stream) => {
            return streamToObservable(
              stream,
              "SUGGEST_TAGS",
              SuggestTagsOutputSchema
            );
          })
        );
      }
    ),
    generateIngredientSuggestions: fromEventObservable(
      ({
        input,
      }: {
        input: {
          personalizationContext: string;
          timeContext: string;
        };
      }) => {
        const tokenStream = new SuggestIngredientStream();
        return from(tokenStream.getStream(input)).pipe(
          switchMap((stream) => {
            return streamToObservable(
              stream,
              "SUGGEST_INGREDIENTS",
              SuggestIngredientsOutputSchema
            );
          })
        );
      }
    ),
  },
  guards: {
    didLoadOnboardingPage: ({ event }) => false,
  },
  actions: {},
}).createMachine({
  id: "BrowserSessionMachine",
  type: "parallel",
  context: ({ input }) => ({
    ...input,
    equipment: {},
    preferences: {},
    diet: {},
    selectedRecipeIds: [],
    suggestedIngredients: [],
    suggestedTags: [],
    lastRunPersonalizationContext: undefined,
    suggestedPlaceholders: [],
    suggestedTokens: [],
    feedItems: {},
    feedItemIds: [],
    listIds: [],
    listsById: {},
  }),
  on: {
    CHANGE: [
      {
        guard: ({ event }) => event.name === "shoppingFrequency",
      },
    ],
    EXPERIENCE_CHANGE: {
      actions: assign({
        experienceLevel: ({ event }) => event.experience,
      }),
    },
    EQUIPMENT_CHANGE: {
      actions: assign({
        equipment: ({ event, context }) =>
          produce(context.equipment, (draft) => {
            draft[event.equipment] = event.value;
          }),
      }),
    },
    DIET_CHANGE: {
      actions: assign({
        diet: ({ event, context }) =>
          produce(context.diet, (draft) => {
            draft[event.dietType] = event.value;
          }),
      }),
    },
    PREFERENCE_CHANGE: {
      actions: assign({
        preferences: ({ event, context }) =>
          produce(context.preferences, (draft) => {
            draft[event.preference] = event.value;
          }),
      }),
    },
    SUGGEST_PLACEHOLDERS_COMPLETE: {
      actions: assign(({ context, event }) =>
        produce(context, (draft) => {
          if (event.data.items) {
            draft.suggestedPlaceholders = event.data.items;
          }
        })
      ),
    },
    SUGGEST_TAGS_PROGRESS: {
      actions: assign(({ context, event }) =>
        produce(context, (draft) => {
          if (event.data.tags) {
            draft.suggestedTags = event.data.tags;
          }
        })
      ),
    },
    SUGGEST_TOKENS_PROGRESS: {
      actions: assign(({ context, event }) =>
        produce(context, (draft) => {
          if (event.data.tokens) {
            draft.suggestedTokens = event.data.tokens;
          }
        })
      ),
    },
    SUGGEST_INGREDIENTS_PROGRESS: {
      actions: assign(({ context, event }) =>
        produce(context, (draft) => {
          if (event.data.ingredients) {
            draft.suggestedIngredients = event.data.ingredients;
          }
        })
      ),
    },
  },
  states: {
    Initialization: {
      initial: "Ready",
      states: {
        Ready: {
          type: "final",
        },
      },
    },
    Connections: {
      on: {
        HEARTBEAT: {
          actions: assign(({ context, event }) => {
            return produce(context, (draft) => {
              const cf = event?.cf;

              if (typeof cf?.continent === "string") {
                draft.continent = cf.continent;
              }
              if (
                typeof cf?.latitude === "string" &&
                typeof cf.longitude === "string"
              ) {
                draft.gps = {
                  latitude: cf.latitude,
                  longitude: cf.longitude,
                };
              }
              if (typeof cf?.postalCode === "string") {
                draft.postalCode = cf.postalCode;
              }

              if (typeof cf?.country === "string") {
                draft.country = cf.country;
              }

              if (typeof cf?.region === "string") {
                draft.region = cf.region;
              }

              if (typeof cf?.regionCode === "string") {
                draft.regionCode = cf.regionCode;
              }

              if (typeof cf?.city === "string") {
                draft.city = cf.city;
              }

              if (typeof cf?.timezone === "string") {
                draft.timezone = cf.timezone;
              }

              draft.lastRunPersonalizationContext =
                getPersonalizationContext(draft);
            });
          }),
        },
      },
    },
    Feed: {
      type: "parallel",
      states: {
        Initialized: {
          initial: "False",
          states: {
            False: {
              on: {
                HEARTBEAT: "True",
              },
            },
            True: {
              entry: assign(({ context, event }) =>
                produce(context, (draft) => {
                  const newItemIds = [
                    randomUUID(),
                    randomUUID(),
                    randomUUID(),
                    randomUUID(),
                    randomUUID(),
                    randomUUID(),
                  ];

                  draft.feedItemIds = [...context.feedItemIds, ...newItemIds];
                  newItemIds.forEach((id) => {
                    draft.feedItems[id] = {
                      id,
                    };
                  });
                })
              ),
              on: {
                HOMEPAGE_CATEGORIES_PROGRESS: {
                  description:
                    "When the stream makes progress, update the feed items as they become available",
                  actions: assign({
                    feedItems: ({ context, event }) =>
                      produce(context.feedItems, (draft) => {
                        const startIndex = context.feedItemIds.length - 6;
                        event.data.items?.forEach((item, index) => {
                          const itemId =
                            context.feedItemIds[startIndex + index];
                          assert(itemId, "expected to find itemId");

                          const existingItem = context.feedItems[itemId];
                          assert(existingItem, "expected existingItem");

                          draft[itemId] = {
                            ...existingItem,
                            ...item,
                          };
                          if (draft[itemId]?.recipes) {
                            draft[itemId]?.recipes?.forEach((draftRecipe) => {
                              if (draftRecipe && !draftRecipe.id) {
                                draftRecipe.id = randomUUID();
                              }
                            });
                          }
                        });
                      }),
                  }),
                },
              },
              invoke: {
                src: "generateHomepageFeed",
                input: ({ context }) => {
                  assert(context.timezone, "expected timezone");
                  const personalizationContext =
                    getPersonalizationContext(context);

                  return {
                    personalizationContext,
                    timeContext: getTimeContext(context.timezone),
                  };
                },
              },
            },
          },
        },
      },
    },
    Selection: {
      on: {},
      type: "parallel",
      states: {
        Items: {
          on: {
            CLEAR_SELECTION: {
              actions: [
                assign({
                  selectedRecipeIds: () => [],
                }),
              ],
            },
            SELECT_RECIPE_SUGGESTION: {
              guard: ({ context, event }) => {
                const feedItemId = context.feedItemIds[event.itemIndex];
                assert(feedItemId, `expected feedItemId at ${event.itemIndex}`);
                const feedItem = context.feedItems[feedItemId];
                assert(feedItem, "expected to find feedItem");
                assert(feedItem.recipes, "expected feed item recipes");
                const recipe = feedItem.recipes[event.recipeIndex];
                assert(
                  recipe,
                  `expected to find recipe at ${event.recipeIndex}`
                );
                return (
                  !!recipe?.id && !context.selectedRecipeIds.includes(recipe.id)
                );
              },
              actions: [
                assign({
                  selectedRecipeIds: ({ context, event }) =>
                    produce(context.selectedRecipeIds, (draft) => {
                      const feedItemId = context.feedItemIds[event.itemIndex];
                      assert(
                        feedItemId,
                        `expected feedItemId at ${event.itemIndex}`
                      );
                      const feedItem = context.feedItems[feedItemId];
                      assert(feedItem, "expected to find feedItem");
                      assert(feedItem.recipes, "expected feed item recipes");
                      const recipe = feedItem.recipes[event.recipeIndex];
                      assert(
                        recipe,
                        `expected to find recipe at ${event.recipeIndex}`
                      );
                      assert(recipe.id, `expected to have recipe id`);

                      // const recipeId = context.feedItems[context.feedItemIds[event.itemIndex]]
                      draft.push(recipe.id);
                    }),
                }),
              ],
            },
            SELECT_RECIPE: {
              guard: ({ context, event }) =>
                !context.selectedRecipeIds.includes(event.id),
              actions: [
                assign({
                  selectedRecipeIds: ({ context, event }) =>
                    produce(context.selectedRecipeIds, (draft) => {
                      draft.push(event.id);
                    }),
                }),
              ],
            },
            // ADD_TO_LIST: {},
            UNSELECT: {
              actions: assign({
                selectedRecipeIds: ({ context, event }) =>
                  context.selectedRecipeIds.filter((item) => item !== event.id),
              }),
            },
          },
        },
        Metadata: {
          type: "parallel",
          states: {
            Created: {
              initial: "False",
              on: {
                CLEAR_SELECTION: {
                  target: ".False",
                },
              },
              states: {
                False: {
                  on: {
                    SELECT_RECIPE: {
                      target: "Creating",
                      actions: assign({
                        selectedListId: () => randomUUID(),
                      }),
                    },
                  },
                },
                Creating: {
                  invoke: {
                    src: "createNewListWithRecipeId",
                    input: ({ context, event }) => {
                      assert(
                        event.type === "SELECT_RECIPE",
                        "expected SELECT_RECIPE"
                      );
                      assert(context.selectedListId, "exlected selectedListId");
                      return {
                        listId: context.selectedListId,
                        recipeId: event.id,
                      };
                    },
                    onDone: "True",
                  },
                },
                True: {},
              },
            },
          },
        },
        Sharing: {
          on: {
            SHARE_SELECTED: {
              actions: assign({
                selectedListId: () => randomUUID(),
              }),
            },
          },
        },
      },
    },
    Suggestions: {
      type: "parallel",
      // this is probably runnin a little too frequently
      // always: {
      //   target: [
      //     ".Ingredients.Running",
      //     ".Tags.Running",
      //     ".Placeholders.Running",
      //     ".Tokens.Running",
      //   ],
      //   actions: assign({
      //     lastRunPersonalizationContext: ({ context }) =>
      //       getPersonalizationContext(context),
      //   }),
      //   guard: ({ context }) =>
      //     !!context.lastRunPersonalizationContext &&
      //     context.lastRunPersonalizationContext !==
      //       getPersonalizationContext(context),
      // },
      states: {
        Ingredients: {
          initial: "Idle",
          states: {
            Idle: {
              on: {
                HEARTBEAT: {
                  target: "Running",
                  guard: ({ event, context }) =>
                    !context.lastRunPersonalizationContext,
                },
              },
            },
            Running: {
              entry: ({ context }) =>
                captureEvent(context.userId, {
                  type: "LLM_CALL",
                  properties: {
                    llmType: "SUGGEST_INGREDIENTS",
                  },
                }),
              invoke: {
                src: "generateIngredientSuggestions",
                input: ({ context }) => {
                  assert(context.timezone, "expected timezone");
                  const personalizationContext =
                    getPersonalizationContext(context);

                  return {
                    personalizationContext,
                    timeContext: getTimeContext(context.timezone),
                  };
                },
                onDone: "Idle",
              },
            },
          },
        },
        Tags: {
          initial: "Idle",
          states: {
            Idle: {
              on: {
                HEARTBEAT: {
                  target: "Running",
                  guard: ({ event, context }) =>
                    !context.lastRunPersonalizationContext,
                },
              },
            },
            Running: {
              entry: ({ context }) =>
                captureEvent(context.userId, {
                  type: "LLM_CALL",
                  properties: {
                    llmType: "SUGGEST_TAGS",
                  },
                }),
              invoke: {
                src: "generateTagSuggestions",
                input: ({ context }) => {
                  assert(context.timezone, "expected timezone");
                  const personalizationContext =
                    getPersonalizationContext(context);

                  return {
                    personalizationContext,
                    timeContext: getTimeContext(context.timezone),
                  };
                },
                onDone: "Idle",
              },
            },
          },
        },
        Placeholders: {
          initial: "Idle",
          states: {
            Idle: {
              on: {
                HEARTBEAT: {
                  target: "Running",
                  guard: ({ event, context }) =>
                    !context.lastRunPersonalizationContext,
                },
              },
            },
            Running: {
              entry: ({ context }) =>
                captureEvent(context.userId, {
                  type: "LLM_CALL",
                  properties: {
                    llmType: "SUGGEST_PLACEHOLDERS",
                  },
                }),
              invoke: {
                src: "generatePlaceholders",
                input: ({ context }) => {
                  assert(context.timezone, "expected timezone");
                  const personalizationContext =
                    getPersonalizationContext(context);

                  return {
                    personalizationContext,
                    timeContext: getTimeContext(context.timezone),
                  };
                },
                onDone: "Idle",
              },
            },
          },
        },
        Tokens: {
          initial: "Idle",
          states: {
            Idle: {
              on: {
                HEARTBEAT: {
                  target: "Running",
                  guard: ({ event, context }) =>
                    !context.lastRunPersonalizationContext,
                },
              },
            },
            Running: {
              entry: ({ context }) =>
                captureEvent(context.userId, {
                  type: "LLM_CALL",
                  properties: {
                    llmType: "SUGGEST_TOKENS",
                  },
                }),
              invoke: {
                src: "generateTokenSuggestions",
                input: ({ context }) => {
                  assert(context.timezone, "expected timezone");
                  const personalizationContext =
                    getPersonalizationContext(context);

                  return {
                    personalizationContext,
                    timeContext: getTimeContext(context.timezone),
                  };
                },
                onDone: "Idle",
              },
            },
          },
        },
      },
    },
    Onboarding: {
      initial: "NotStarted",
      states: {
        NotStarted: {
          on: {
            PAGE_LOADED: {
              target: "Welcome",
              guard: ({ event, context }) => {
                return event.pathname.startsWith("/quiz");
              },
            },
          },
        },
        Welcome: {
          on: {
            PAGE_LOADED: {
              target: "Experience",
              guard: ({ event }) => {
                return event.pathname.startsWith("/quiz/experience");
              },
            },
          },
        },
        Experience: {
          on: {
            PAGE_LOADED: {
              target: "Taste",
              guard: ({ event }) => event.pathname.startsWith("/quiz/taste"),
            },
          },
        },
        Taste: {
          on: {
            PAGE_LOADED: {
              target: "Shopping",
              guard: ({ event }) => event.pathname.startsWith("/quiz/shopping"),
            },
          },
        },
        Shopping: {
          on: {
            PAGE_LOADED: {
              target: "Diet",
              guard: ({ event }) => event.pathname.startsWith("/quiz/diet"),
            },
          },
        },
        Diet: {
          on: {
            PAGE_LOADED: {
              target: "Equipment",
              guard: ({ event }) =>
                event.pathname.startsWith("/quiz/equipment"),
            },
          },
        },
        Equipment: {
          on: {
            PAGE_LOADED: {
              target: "Complete",
              guard: ({ event }) => event.pathname.startsWith("/quiz/results"),
            },
          },
        },
        Complete: {
          // todo update the results here...
          type: "final",
        },
      },
    },
  },
});

export type BrowserSessionMachine = typeof browserSessionMachine;
