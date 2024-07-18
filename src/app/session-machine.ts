import { captureEvent } from "@/actions/capturePostHogEvent";
import { HINTS } from "@/constants/hints";
import { EMAIL_INPUT_KEY, SIGN_IN_CODE_INPUT_KEY } from "@/constants/inputs";
import { ListRecipeTable, ListTable, UsersTable } from "@/db";
import { getPersonalizationContext, getTimeContext } from "@/lib/llmContext";
import { streamToObservable } from "@/lib/stream-to-observable";
import { assert, noop, shuffle } from "@/lib/utils";
import { Caller, PartyMap, SessionContext, SessionEvent } from "@/types";
import { createClient } from "@vercel/postgres";
import { randomUUID } from "crypto";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { produce } from "immer";
import * as Party from "partykit/server";
import { Resend } from "resend";
import { from, switchMap } from "rxjs";
import {
  StateValueFrom,
  assign,
  fromEventObservable,
  fromPromise,
  setup,
} from "xstate";
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
import { SuggestedInterestsStream } from "./suggested-interests.stream";

const InputSchema = z.object({
  id: z.string(),
  initialCaller: z.custom<Caller>(),
});
type Input = z.infer<typeof InputSchema>;

export const createSessionMachine = ({
  id,
  storage,
  parties,
}: {
  id: string;
  storage: Party.Storage;
  parties: PartyMap;
}) => {
  const sessionMachine = setup({
    types: {
      input: {} as Input,
      context: {} as SessionContext,
      events: {} as SessionEvent,
    },
    actors: {
      sendSignInEmail: fromPromise(
        async ({ input }: { input: { email: string; code: string } }) => {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const result = await resend.emails.send({
            from: "KitchenCraft <signin@mail.kitchencraft.ai>",
            to: input.email,
            subject: "Your Sign-In Code",
            text: `To sign-in to KitchenCraft, enter this code: ${input.code}. This code will expire in 5 minutes.`,
            html: `<div><p>To sign-in to KitchenCraft, enter this code:</p><p>${input.code}</p><p>This code will expire in 5 minutes.</p></div>`,
          });
          if (result.error) {
            throw new Error(result.error.message);
          }
        }
      ),
      sendWelcomeEmail: fromPromise(
        async ({ input }: { input: { email: string } }) => {
          return "";
        }
      ),
      checkIfSignInCodeIsValid: fromPromise(
        async ({ input }: { input: { code: string } }) => {
          const signInCode = await storage.get("signInCode");
          // todo verify the email matches
          return input.code === signInCode;
        }
      ),
      fetchUserIdForEmail: fromPromise(
        async ({ input }: { input: { email: string } }) => {
          const client = createClient();
          await client.connect();
          const db = drizzle(client);
          try {
            const users = await db
              .select()
              .from(UsersTable)
              .where(eq(UsersTable.email, input.email))
              .execute();
            const user = users[0];
            assert(user, "expected user");
            return user.id;
          } finally {
            await client.end();
          }
        }
      ),
      fetchLists: fromPromise(
        async ({ input }: { input: { userId: string } }) => {
          const client = createClient();
          await client.connect();
          const db = drizzle(client);
          try {
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
          } finally {
            await client.end();
          }
        }
      ),
      createNewListWithRecipeId: fromPromise(
        async ({ input }: { input: { listId: string; recipeId: string } }) => {
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
        }) => new SuggestedInterestsStream().getObservable(input)
      ),
      // generateWelcomeMessage: fromEventObservable(
      //   ({
      //     input,
      //   }: {
      //     input: {
      //       profileName: string;
      //       personalizationContext: string;
      //       preferences: Record<number, number>;
      //     };
      //   }) => new WelcomeMessageStream().getObservable(input)
      // ),
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
    guards: {},
    actions: {},
  }).createMachine({
    id: "SessionMachine",
    type: "parallel",
    context: ({ input }) => {
      return {
        id: input?.id, // ? so initialSnapshot works without input
        userId: input?.initialCaller?.id,
        authenticated: false,
        equipment: {},
        preferences: {},
        diet: {},
        goals: [],
        interests: [],
        selectedRecipeIds: [],
        suggestedIngredients: [],
        preferenceQuestionResults: {},
        suggestedTags: [],
        currentSaveToListSlug: "liked",
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
        hints: shuffle(HINTS).slice(0, 3),
        dismissedHints: {},
      };
    },
    on: {
      SAVE_RECIPE: {
        guard: ({ context, event }) => !!event.listSlug,
        actions: assign({
          currentSaveToListSlug: ({ context, event }) => {
            assert(event.listSlug, "expected listSlug");
            return event.listSlug;
          },
        }),
      },
      LIST_CREATED: {
        actions: assign({
          // todo expire this after a heartbeat...
          currentSaveToListSlug: ({ context, event }) => {
            return event.slug;
          },
        }),
      },
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
      // PREFERENCE_CHANGE: {
      //   actions: assign({
      //     preferences: ({ event, context }) =>
      //       produce(context.preferences, (draft) => {
      //         draft[event.preference] = event.value;
      //       }),
      //   }),
      // },
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
      Auth: {
        initial: "Anonymous",
        states: {
          Anonymous: {
            on: {
              SIGN_IN: {
                target: "SigningIn",
                // guard: stateIn({ Initialization: "Ready" } satisfies AppState),
              },
            },
          },
          SigningIn: {
            onDone: "Authenticated",
            on: {
              CANCEL: {
                target: "Anonymous",
              },
            },
            initial: "Inputting",
            states: {
              Inputting: {
                on: {
                  SUBMIT: {
                    target: ".Validating",
                  },
                  CHANGE: {
                    target: ".Waiting",
                    guard: ({ event }) => event.name === EMAIL_INPUT_KEY,
                    actions: assign({
                      email: ({ event }) => event.value,
                    }),
                  },
                },
                initial: "Waiting",
                onDone: "SendingEmail",
                states: {
                  Waiting: {},
                  Error: {
                    on: {
                      CHANGE: {
                        target: "Waiting",
                        guard: ({ event }) => event.name === EMAIL_INPUT_KEY,
                        actions: assign({
                          email: ({ event }) => event.value,
                        }),
                      },
                    },
                  },
                  Validating: {
                    invoke: {
                      src: "fetchUserIdForEmail",
                      input: ({ context }) => {
                        const email = z.string().email().parse(context.email);
                        return { email };
                      },
                      onError: "Error",
                      onDone: "Valid",
                    },
                  },
                  Valid: {
                    type: "final",
                  },
                },
              },
              SendingEmail: {
                invoke: {
                  src: "sendSignInEmail",
                  input: ({ context }) => {
                    const email = z.string().email().parse(context.email);
                    const code = generateSignInCode();

                    // todo maybe use redis for this so it can self expire?
                    storage
                      .put("signInCode", code)
                      .then(noop)
                      .catch((e) => {
                        console.error(e);
                      });

                    return { email, code };
                  },
                  onDone: "WaitingForCode",
                },
              },
              WaitingForCode: {
                after: {
                  300000: "Expired",
                },
                onDone: "Complete",
                initial: "Inputting",
                states: {
                  Inputting: {
                    on: {
                      SUBMIT: "Verifying",
                      CHANGE: {
                        guard: ({ event }) =>
                          event.name === SIGN_IN_CODE_INPUT_KEY,
                        actions: assign({
                          signInCode: ({ event }) => event.value,
                        }),
                      },
                    },
                  },
                  Verifying: {
                    invoke: {
                      src: "checkIfSignInCodeIsValid",
                      input: ({ context, event }) => {
                        assert(
                          context.signInCode,
                          "expected signInCode to be set"
                        );
                        return {
                          code: context.signInCode,
                        };
                      },
                      onDone: [
                        {
                          target: "Invalid",
                          guard: ({ event }) => !event.output,
                        },
                        { target: "UpdatingUser" },
                      ],
                    },
                  },
                  Invalid: {
                    on: {
                      CHANGE: {
                        target: "Inputting",
                        guard: ({ event }) =>
                          event.name === SIGN_IN_CODE_INPUT_KEY,
                        actions: assign({
                          signInCode: ({ event }) => event.value,
                        }),
                      },
                    },
                  },
                  UpdatingUser: {
                    invoke: {
                      src: "fetchUserIdForEmail",
                      input: ({ context }) => {
                        const email = z.string().email().parse(context.email);
                        return { email };
                      },
                      onDone: {
                        target: "Complete",
                        actions: assign({
                          userId: ({ event }) => event.output,
                        }),
                      },
                    },
                  },
                  Complete: {
                    type: "final",
                    // TODO kick off any jobs to update the userId on recipes/lists somewhere here
                  },
                },
              },
              Expired: {
                entry: ({ context }) => {
                  storage
                    .delete("signInCode")
                    .then(noop)
                    .catch((e) => {
                      console.error(e);
                    });
                },
              },
              Complete: {
                type: "final",
              },
            },
          },
          Registering: {
            initial: "InputtingEmail",
            onDone: "Authenticated",
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
                    // guard: "hasValidChefName",
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
          Authenticated: {},
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
                  return (
                    !!recipe?.id &&
                    !context.selectedRecipeIds?.includes(recipe.id)
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
                        draft && draft.push(recipe.id);
                      }),
                  }),
                ],
              },
              SELECT_RECIPE: {
                guard: ({ context, event }) =>
                  !context.selectedRecipeIds?.includes(event.id),
                actions: [
                  assign({
                    selectedRecipeIds: ({ context, event }) =>
                      produce(context.selectedRecipeIds, (draft) => {
                        draft && draft.push(event.id);
                      }),
                  }),
                ],
              },
              // ADD_TO_LIST: {},
              UNSELECT: {
                actions: assign({
                  selectedRecipeIds: ({ context, event }) =>
                    context.selectedRecipeIds?.filter(
                      (item) => item !== event.id
                    ),
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
                        assert(
                          context.selectedListId,
                          "exlected selectedListId"
                        );
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
      Hints: {
        on: {
          DISMISS_HINT: {
            actions: assign({
              dismissedHints: ({ context, event }) =>
                produce(context.dismissedHints, (draft) => {
                  draft[event.index] = true;
                }),
            }),
          },
        },
      },
    },
  });
  return sessionMachine;
};

export type SessionMachine = ReturnType<typeof createSessionMachine>;
export type SessionState = StateValueFrom<SessionMachine>;

function generateSignInCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Avoid confusing characters
  let code = "";
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  return code;
}
