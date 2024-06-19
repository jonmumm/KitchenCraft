import { sendWelcomeEmail } from "@/actors/sendWelcomeEmail";
import { ListTable, ProfileSchema, ProfileTable, UsersTable } from "@/db";
import { getPersonalizationContext } from "@/lib/llmContext";
import { assert } from "@/lib/utils";
import { PartyMap, UserContext, UserEvent } from "@/types";
import { createClient } from "@vercel/postgres";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { produce } from "immer";
import * as Party from "partykit/server";
import {
  SnapshotFrom,
  StateValueFrom,
  and,
  assign,
  fromEventObservable,
  fromPromise,
  setup,
  spawnChild,
  stateIn,
} from "xstate";
import { z } from "zod";
import { FeedTopicsStream } from "./feed-topics.stream";
import {
  SuggestProfileNamesInput,
  SuggestProfileNamesStream,
} from "./suggest-profile-names.stream";

const InputSchema = z.object({
  id: z.string(),
});
type Input = z.infer<typeof InputSchema>;

export const createUserMachine = ({
  id,
  storage,
  parties,
}: {
  id: string;
  storage: Party.Storage;
  parties: PartyMap;
}) => {
  const userMachine = setup({
    types: {
      input: {} as Input,
      context: {} as UserContext,
      events: {} as UserEvent,
    },
    actors: {
      setEmailOnUser: fromPromise(
        async ({ input }: { input: { userId: string; email: string } }) => {
          const client = createClient();
          await client.connect();
          const db = drizzle(client);
          try {
            await db
              .update(UsersTable)
              .set({ email: input.email })
              .where(eq(UsersTable.id, input.userId))
              .execute();
          } finally {
            await client.end();
          }
        }
      ),
      createUser: fromPromise(
        async ({ input }: { input: { userId: string } }) => {
          const client = createClient();
          await client.connect();
          const db = drizzle(client);
          try {
            await db.insert(UsersTable).values({ id: input.userId }).execute();
            return null;
          } finally {
            await client.end();
          }
        }
      ),
      checkIfEmailAvailable: fromPromise(
        async ({ input }: { input: { email: string } }) => {
          const client = createClient();
          await client.connect();
          const db = drizzle(client);
          try {
            const result = await db
              .select()
              .from(UsersTable)
              .where(eq(UsersTable.email, input.email))
              .execute();
            return result.length === 0;
          } finally {
            await client.end();
          }
        }
      ),
      fetchListById: fromPromise(
        async ({ input }: { input: { listId: string } }) => {
          const client = createClient();
          await client.connect();
          const db = drizzle(client);
          try {
            const list = await db
              .select()
              .from(ListTable)
              .where(eq(ListTable.id, input.listId))
              .execute();
            return list[0]; // Assuming listId is unique and returns a single list
          } finally {
            await client.end();
          }
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
      checkIfProfileNameAvailable: fromPromise(
        async ({ input }: { input: { profileName: string } }) => {
          const client = createClient();
          await client.connect();
          const db = drizzle(client);
          try {
            const result = await db
              .select()
              .from(ProfileTable)
              .where(eq(ProfileTable.profileSlug, input.profileName))
              .execute();
            return result.length === 0;
          } finally {
            await client.end();
          }
        }
      ),
      generateProfileNameSuggestions: fromEventObservable(
        ({ input }: { input: SuggestProfileNamesInput }) =>
          new SuggestProfileNamesStream().getObservable(input)
      ),
      sendWelcomeEmail,
    },
    guards: {
      didChangeListNameInput: ({ event }) => {
        return event.type === "CHANGE" && event.name === "listName";
      },
      didChangeProfileNameInput: ({ context, event }) => {
        return event.type === "CHANGE" && event.name === "profileName";
      },
      didChangeEmailInput: ({ context, event }) => {
        return event.type === "CHANGE" && event.name === "email";
      },
    },
    actions: {},
  }).createMachine({
    id: "UserMachine",
    type: "parallel",
    context: ({ input }) => {
      return {
        ...input,
        preferenceQuestionResults: {},
        suggestedProfileNames: [],
        suggestedFeedTopics: [],
        selectedFeedTopics: [],
        equipment: {},
        preferences: {},
        diet: {},
        previousSuggestedProfileNames: [],
      };
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
      UserRow: {
        initial: "NotExists",
        states: {
          NotExists: {
            on: {
              HEARTBEAT: "Creating",
            },
          },
          Creating: {
            invoke: {
              src: "createUser",
              input: ({ context, event }) => {
                return {
                  userId: context.id,
                };
              },
              onDone: "Created",
            },
          },
          Error: {
            on: {
              HEARTBEAT: "Creating",
            },
          },
          Created: {},
        },
      },

      ProfileName: {
        initial: "Uninitialized",
        states: {
          Uninitialized: {},
          Checking: {},
          Claimed: {},
        },
      },

      Email: {
        type: "parallel",
        states: {
          Availability: {
            initial: "Uninitialized",
            states: {
              Uninitialized: {
                on: {
                  CHANGE: {
                    target: "Inputting",
                    guard: "didChangeEmailInput",
                    actions: assign({
                      email: ({ event }) => event.value,
                    }),
                  },
                },
              },
              Inputting: {
                on: {
                  SUBMIT: {
                    target: "Checking",
                    guard: ({ context }) =>
                      z.string().email().safeParse(context.email).success,
                  },
                  CHANGE: {
                    reenter: true,
                    target: "Inputting",
                    guard: "didChangeEmailInput",
                    actions: assign({
                      email: ({ event }) => event.value,
                    }),
                  },
                },
              },
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
                      target: "Available",
                    },
                    {
                      target: "Unavailable",
                    },
                  ],
                },
              },
              Unavailable: {
                on: {
                  CHANGE: {
                    target: "Inputting",
                    guard: "didChangeEmailInput",
                    actions: assign({
                      email: ({ event }) => event.value,
                    }),
                  },
                },
              },
              Available: {},
            },
          },

          WelcomeEmail: {
            initial: "Unsent",
            states: {
              Unsent: {
                always: {
                  target: "Sending",
                  guard: stateIn({ Email: { Availability: "Available" } }),
                },
              },
              Sending: {
                invoke: {
                  src: "sendWelcomeEmail",
                  input: ({ context, event }) => {
                    const email = z.string().email().parse(context.email);
                    return { email };
                  },
                  onDone: "Sent",
                },
              },
              Sent: {
                type: "final",
              },
            },
          },
          Verification: {
            initial: "Unverified",
            states: {
              Unverified: {
                on: {
                  // Link click?
                  // Can we send a system event
                },
              },
              Verified: {},
            },
          },
          Saved: {
            initial: "False",
            states: {
              False: {
                always: {
                  target: "InProgress",
                  guard: and([
                    stateIn({ Email: { Availability: "Available" } }),
                    stateIn({ UserRow: "Created" }),
                  ]),
                },
              },
              InProgress: {
                invoke: {
                  src: "setEmailOnUser",
                  onDone: "True",
                  input: ({ context, event }) => {
                    const email = z.string().email().parse(context.email);

                    return {
                      userId: context.id,
                      email,
                    };
                  },
                },
              },
              True: {
                type: "final",
              },
            },
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
              });
            }),
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
                guard: ({ event }) => {
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
                guard: ({ event }) =>
                  event.pathname.startsWith("/quiz/summary"),
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
                    input: ({ context }) => {
                      assert(
                        context.email,
                        "expected email when generating profile name suggestions"
                      );
                      const previousSuggestions =
                        context.previousSuggestedProfileNames.concat(
                          context.suggestedProfileNames
                        );
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
                  SUBMIT: [
                    {
                      target: "Email",
                      // guard: stateIn,
                    },
                    {
                      target: "ProfileName",
                      // guard: ({ context }) => !context.profileName,
                    },
                    {
                      target: "Complete",
                    },
                  ],
                },
              },
              Email: {
                always: {
                  target: "ProfileName",
                  guard: stateIn({ Email: { Availability: "Available" } }),
                  actions: spawnChild("generateProfileNameSuggestions", {
                    input: ({ context }) => {
                      assert(
                        context.email,
                        "expected email when generating profile name suggestions"
                      );
                      const previousSuggestions =
                        context.previousSuggestedProfileNames.concat(
                          context.suggestedProfileNames
                        );
                      return {
                        email: context.email,
                        previousSuggestions,
                        preferences: {},
                        personalizationContext:
                          "Oakland, CA. 36 years old. father of 2. cooks for family a lot",
                      };
                    },
                  }),
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
        on: {
          LIST_CREATED: {
            // todo also write an action called
            // fetchListById
            // and then use the output to set it on
            // listsById
            actions: [
              assign(({ context, event }) =>
                produce(context, (draft) => {
                  if (!draft.recentListIds) {
                    draft.recentListIds = [event.id];
                  } else {
                    draft.recentListIds.unshift(event.id);
                  }
                })
              ),
              // assign({
              //   listsById: ({ context, event }) =>
              //     produce(context.listsById, (draft) => {
              //       draft[event.id] = {
              //         id: event.id,
              //         name: event.name,
              //         slug: event.slug,
              //         created: true,
              //         count: 0,
              //         public: true,
              //         idSet: {},
              //         createdAt: new Date().toISOString(),
              //       };
              //     }),
              // }),

              // spawnChild("fetchListById", {
              //   input: ({ event }) => {
              //     assertEvent(event, "LIST_CREATED");
              //     return {
              //       listId: event.id,
              //     };
              //   },
              // }),
            ],
          },
        },
      },
    },
  });
  return userMachine;
};

export type UserMachine = ReturnType<typeof createUserMachine>;
export type UserSnapshot = SnapshotFrom<UserMachine>;
export type UserState = StateValueFrom<UserMachine>;
