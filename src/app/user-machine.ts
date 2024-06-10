import { ProfileSchema, ProfileTable, UsersTable } from "@/db";
import { getPersonalizationContext } from "@/lib/llmContext";
import { assert } from "@/lib/utils";
import { UserContext, UserEvent } from "@/types";
import { createClient } from "@vercel/postgres";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { produce } from "immer";
import * as Party from "partykit/server";
import {
  SnapshotFrom,
  StateValueFrom,
  assign,
  fromEventObservable,
  fromPromise,
  setup,
  spawnChild,
} from "xstate";
import { z } from "zod";
import { FeedTopicsStream } from "./feed-topics.stream";
import {
  SuggestProfileNamesInput,
  SuggestProfileNamesStream,
} from "./suggest-profile-names.stream";

const InputSchema = z.object({
  id: z.string(),
  storage: z.custom<Party.Storage>(),
});
type Input = z.infer<typeof InputSchema>;

export const userMachine = setup({
  types: {
    input: {} as Input,
    context: {} as UserContext,
    events: {} as UserEvent,
  },
  actors: {
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
    sendWelcomeEmail: fromPromise(
      async ({ input }: { input: { email: string } }) => {
        return "";
      }
    ),
  },
  guards: {
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
  },
});

export type UserMachine = typeof userMachine;
export type UserSnapshot = SnapshotFrom<UserMachine>;
export type UserState = StateValueFrom<UserMachine>;
