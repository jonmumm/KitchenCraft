import { captureEvent } from "@/actions/capturePostHogEvent";
import {
  ListRecipeTable,
  ListTable,
  ProfileSchema,
  ProfileTable,
  UsersTable,
  db,
} from "@/db";
import { getPersonalizationContext, getTimeContext } from "@/lib/llmContext";
import { streamToObservable } from "@/lib/stream-to-observable";
import { assert } from "@/lib/utils";
import { BrowserSessionContext, BrowserSessionEvent } from "@/types";
import { randomUUID } from "crypto";
import { eq, inArray } from "drizzle-orm";
import { produce } from "immer";
import { from, switchMap } from "rxjs";
import {
  StateValueFrom,
  assign,
  fromEventObservable,
  fromPromise,
  setup,
  spawnChild,
} from "xstate";
import { z } from "zod";
import { FeedTopicsStream } from "./feed-topics.stream";
import { HomepageCategoriesStream } from "./homepage-categories.stream";
import {
  SuggestIngredientStream,
  SuggestIngredientsOutputSchema,
} from "./suggest-ingredients.stream";
import { SuggestPlaceholderStream } from "./suggest-placeholder.stream";
import {
  SuggestProfileNamesInput,
  SuggestProfileNamesStream,
} from "./suggest-profile-names.stream";
import {
  SuggestTagsOutputSchema,
  SuggestTagsStream,
} from "./suggest-tags.stream";
import { SuggestTokensStream } from "./suggest-tokens.stream";
import { WelcomeMessageStream } from "./welcome-message.stream";

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
    sendWelcomeEmail: fromPromise(
      async ({ input }: { input: { email: string } }) => {
        return "";
      }
    ),
    checkIfProfileNameAvailable: fromPromise(
      async ({ input }: { input: { profileName: string } }) => {
        const result = await db
          .select()
          .from(ProfileTable)
          .where(eq(ProfileTable.profileSlug, input.profileName))
          .execute();
        return result.length === 0;
      }
    ),
    fetchLists: fromPromise(
      async ({ input }: { input: { userId: string } }) => {
        const lists = await db
          .select()
          .from(ListTable)
          .where(eq(ListTable.createdBy, input.userId))
          .execute();

        const listIds = lists.map((item) => item.id);
        const listRecipes = listIds.length
          ? await db
              .select()
              .from(ListRecipeTable)
              .where(inArray(ListRecipeTable.listId, listIds))
              .execute()
          : [];

        return { lists, listRecipes };
      }
    ),
    checkIfEmailAvailable: fromPromise(
      async ({ input }: { input: { email: string } }) => {
        const result = await db
          .select()
          .from(UsersTable)
          .where(eq(UsersTable.email, input.email))
          .execute();
        return result.length === 0;
      }
    ),
    createNewListWithRecipeId: fromPromise(
      async ({ input }: { input: { listId: string; recipeId: string } }) => {
        console.log(input);
        return "";
      }
    ),
    generateFeedTopics: fromEventObservable(
      ({
        input,
      }: {
        input: {
          personalizationContext: string;
          preferences: Record<number, number>;
        };
      }) => new FeedTopicsStream().getObservable(input)
    ),
    generateWelcomeMessage: fromEventObservable(
      ({
        input,
      }: {
        input: {
          profileName: string;
          personalizationContext: string;
          preferences: Record<number, number>;
        };
      }) => new WelcomeMessageStream().getObservable(input)
    ),
    generateHomepageFeed: fromEventObservable(
      ({
        input,
      }: {
        input: {
          personalizationContext: string;
          timeContext: string;
          preferences: Record<number, number>;
          pastTopics: Array<string>;
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
    generateProfileNameSuggestions: fromEventObservable(
      ({ input }: { input: SuggestProfileNamesInput }) =>
        new SuggestProfileNamesStream().getObservable(input)
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
    didChangeProfileNameInput: ({ context, event }) => {
      return event.type === "CHANGE" && event.name === "profileName";
    },
    didChangeEmailInput: ({ context, event }) => {
      return event.type === "CHANGE" && event.name === "email";
    },
  },
  actions: {},
}).createMachine({
  id: "BrowserSessionMachine",
  type: "parallel",
  context: ({ input }) => {
    return {
      ...input,
      equipment: {},
      preferences: {},
      diet: {},
      selectedRecipeIds: [],
      suggestedIngredients: [],
      preferenceQuestionResults: {},
      suggestedTags: [],
      generationIdSets: {},
      lastRunPersonalizationContext: undefined,
      selectedFeedTopics: [],
      suggestedPlaceholders: [],
      suggestedTokens: [],
      suggestedProfileNames: [],
      previousSuggestedProfileNames: [],
      feedItemIds: [],
      feedItemsById: {},
      listIds: [],
      listsById: {},
    };
  },
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
          on: {
            REFRESH_FEED: {
              target: ".True",
              reenter: true,
            },
          },
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
                  // TODO:
                  // We can build the feed here...
                  // We have the data fetched
                  // And then on the first heartbeat, do all the LLM processing...

                  const newItemIds = [
                    randomUUID(),
                    randomUUID(),
                    randomUUID(),
                    randomUUID(),
                    randomUUID(),
                    randomUUID(),
                  ];
                  console.log({ newItemIds });

                  draft.feedItemIds = [...newItemIds];
                  newItemIds.forEach((id) => {
                    draft.feedItemsById[id] = {
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
                    feedItemsById: ({ context, event }) =>
                      produce(context.feedItemsById, (draft) => {
                        const startIndex = context.feedItemIds.length - 6;
                        event.data.items?.forEach((item, index) => {
                          const itemId =
                            context.feedItemIds[startIndex + index];
                          assert(itemId, "expected to find itemId");

                          const existingItem = context.feedItemsById[itemId];
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
                    preferences: context.preferenceQuestionResults,
                    pastTopics: context.selectedFeedTopics,
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
                const feedItem = context.feedItemsById[feedItemId];
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
                      const feedItem = context.feedItemsById[feedItemId];
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

                  console.log({ personalizationContext });
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
              target: "Intro",
              guard: ({ event, context }) => {
                return event.pathname.startsWith("/quiz/intro");
              },
            },
          },
        },
        Intro: {
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
              target: "Preferences",
              guard: ({ event }) =>
                event.pathname.startsWith("/quiz/preferences"),
            },
          },
        },
        Preferences: {
          on: {
            PAGE_LOADED: {
              target: "Summary",
              guard: ({ event }) => event.pathname.startsWith("/quiz/summary"),
            },
            SELECT_QUESTION_OPTION: {
              actions: assign(({ context, event }) =>
                produce(context, (draft) => {
                  if (!draft.preferenceQuestionResults) {
                    draft.preferenceQuestionResults = {};
                  }
                  draft.preferenceQuestionResults[event.questionIndex] =
                    event.optionIndex;
                })
              ),
            },
          },
        },
        Summary: {
          onDone: "Complete",
          initial: "Topics",
          on: {
            SUGGEST_PROFILE_NAME_PROGRESS: {
              actions: assign({
                suggestedProfileNames: ({ event, context }) => {
                  const names = event.data.names;
                  return names || context.suggestedProfileNames;
                },
              }),
            },
            SUGGEST_PROFILE_NAME_COMPLETE: {
              actions: assign({
                suggestedProfileNames: ({ event, context }) => {
                  const names = event.data.names;
                  return names;
                },
              }),
            },
            LOAD_MORE: {
              actions: [
                assign(({ context }) =>
                  produce(context, (draft) => {
                    draft.previousSuggestedProfileNames =
                      context.previousSuggestedProfileNames.concat(
                        context.suggestedProfileNames
                      );
                    draft.suggestedProfileNames = [];
                  })
                ),
                spawnChild("generateProfileNameSuggestions", {
                  input: ({ context, event }) => {
                    assert(
                      context.email,
                      "expected email when generating profile name suggestions"
                    );
                    const previousSuggestions =
                      context.previousSuggestedProfileNames.concat(
                        context.suggestedProfileNames
                      );
                    console.log(previousSuggestions);
                    return {
                      email: context.email,
                      previousSuggestions,
                      preferences: {},
                      personalizationContext:
                        "Oakland, CA. 36 years old. father of 2. cooks for family a lot",
                    };
                  },
                }),
              ],
            },
          },
          states: {
            Topics: {
              entry: spawnChild("generateFeedTopics", {
                input: ({ context }) => {
                  const personalizationContext =
                    getPersonalizationContext(context);

                  return {
                    personalizationContext,
                    preferences: context.preferenceQuestionResults,
                  };
                },
              }),
              on: {
                SELECT_TOPIC: {
                  actions: assign({
                    selectedFeedTopics: ({ context, event }) => [
                      ...context.selectedFeedTopics,
                      event.topic,
                    ],
                  }),
                },
                FEED_TOPICS_PROGRESS: {
                  actions: assign({
                    suggestedFeedTopics: ({ event }) => event.data.topics,
                  }),
                },
                SUBMIT: {
                  target: "Email",
                },
              },
            },
            Email: {
              onDone: "ProfileName",
              on: {
                CHANGE: {
                  target: ".Inputting",
                  guard: "didChangeEmailInput",
                  actions: assign({
                    email: ({ event }) => event.value,
                  }),
                },
                SUBMIT: {
                  guard: ({ context }) =>
                    z.string().email().safeParse(context.email).success,
                  target: ".Checking",
                },
              },
              initial: "Inputting",
              states: {
                Inputting: {},
                Checking: {
                  invoke: {
                    src: "checkIfEmailAvailable",
                    input: ({ context }) => {
                      assert(context.email, "expected email when checking");
                      return {
                        email: context.email,
                      };
                    },
                    onDone: [
                      {
                        guard: ({ event }) => event.output,
                        target: "Sending",
                      },
                      {
                        target: "InUse",
                      },
                    ],
                  },
                },
                InUse: {},
                Sending: {
                  entry: spawnChild("generateProfileNameSuggestions", {
                    input: ({ context, event }) => {
                      assert(
                        context.email,
                        "expected email when generating profile name suggestions"
                      );
                      return {
                        email: context.email,
                        previousSuggestions: [],
                        preferences: context.preferenceQuestionResults,
                        personalizationContext:
                          getPersonalizationContext(context),
                      };
                    },
                  }),
                  invoke: {
                    src: "sendWelcomeEmail",
                    input: ({ context }) => {
                      assert(
                        context.email,
                        "expected email when sending welcome email"
                      );
                      return {
                        email: context.email,
                      };
                    },
                    onDone: "Sent",
                  },
                },
                Sent: {
                  type: "final",
                },
              },
            },
            ProfileName: {
              initial: "Inputting",
              onDone: "Complete",
              on: {
                CHANGE: {
                  target: ".Inputting",
                  guard: "didChangeProfileNameInput",
                  actions: assign({
                    profileName: ({ event }) => event.value,
                  }),
                },
                SUBMIT: {
                  guard: ({ context }) =>
                    ProfileSchema.shape.profileSlug.safeParse(
                      context.profileName
                    ).success,
                  target: ".Checking",
                },
              },
              states: {
                Inputting: {
                  on: {},
                },
                Checking: {
                  invoke: {
                    src: "checkIfProfileNameAvailable",
                    input: ({ context }) => {
                      assert(
                        context.profileName,
                        "expected profileName when checking"
                      );
                      return {
                        profileName: context.profileName,
                      };
                    },
                    onDone: [
                      {
                        guard: ({ event }) => event.output,
                        target: "Complete",
                      },
                      {
                        target: "InUse",
                      },
                    ],
                  },
                },
                InUse: {},
                Complete: {
                  type: "final",
                },
              },
            },
            Complete: {
              type: "final",
            },
          },
        },
        Complete: {
          type: "final",
        },
      },
    },
    Lists: {
      initial: "Loading",
      states: {
        Loading: {
          invoke: {
            src: "fetchLists",
            input: ({ context }) => {
              return {
                userId: context.userId,
              };
            },
            onDone: {
              target: "Ready",
              actions: assign(({ context, event }) => {
                return produce(context, (draft) => {
                  const recipeIdsByListId: Record<
                    string,
                    Record<string, true>
                  > = {};
                  event.output.listRecipes.forEach(({ recipeId, listId }) => {
                    if (!recipeIdsByListId[listId]) {
                      recipeIdsByListId[listId] = {};
                    }
                    recipeIdsByListId[listId]![recipeId] = true;
                  });

                  event.output.lists.forEach((list) => {
                    const idSet = recipeIdsByListId[list.id];
                    assert(idSet, "expected idSet for list: " + list.id);

                    draft.listIds.push(list.id);
                    draft.listsById[list.id] = {
                      id: list.id,
                      name: list.name,
                      slug: list.slug,
                      isPublic: true,
                      count: Object.keys(idSet).length,
                      idSet,
                    };
                  });
                });
              }),
            },
          },
        },
        Ready: {
          on: {
            ADD_SELECTED: {},
          },
        },
      },
    },
  },
});

export type BrowserSessionMachine = typeof browserSessionMachine;
export type BrowserSessionState = StateValueFrom<BrowserSessionMachine>;
