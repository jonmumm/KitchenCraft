import { sendWelcomeEmail } from "@/actors/sendWelcomeEmail";
import {
  EMAIL_INPUT_KEY,
  GOALS_INPUT_KEY,
  INTERESTS_INPUT_KEY,
  PROFILE_NAME_INPUT_KEY,
} from "@/constants/inputs";
import { CookingGoal } from "@/constants/onboarding";
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
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";
import {
  SnapshotFrom,
  StateValueFrom,
  and,
  assertEvent,
  assign,
  fromEventObservable,
  fromPromise,
  setup,
  spawnChild,
  stateIn,
} from "xstate";
import { z } from "zod";
import { QuestionIdsSchema } from "./quiz/preferences/constants";
import {
  SuggestProfileNamesInput,
  SuggestProfileNamesStream,
} from "./suggest-profile-names.stream";
import { SuggestedInterestsStream } from "./suggested-interests.stream";

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
      setProfileSlug: fromPromise(
        async ({
          input,
        }: {
          input: { userId: string; profileSlug: string };
        }) => {
          const client = createClient();
          await client.connect();
          const db = drizzle(client);
          try {
            await db
              .update(ProfileTable)
              .set({ profileSlug: input.profileSlug })
              .where(eq(ProfileTable.userId, input.userId))
              .execute();
          } finally {
            await client.end();
          }
        }
      ),
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
      createProfile: fromPromise(
        async ({ input }: { input: { userId: string; name: string } }) => {
          const client = createClient();
          await client.connect();
          const db = drizzle(client);
          try {
            await db
              .insert(ProfileTable)
              .values({ userId: input.userId, profileSlug: input.name })
              .returning({ serialNum: ProfileTable.serialNum })
              .execute();
            return null;
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
      generateSuggestedInterests: fromEventObservable(
        ({
          input,
        }: {
          input: {
            personalizationContext: string;
          };
        }) => new SuggestedInterestsStream().getObservable(input)
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
      didChangeInterest: ({ event }) => {
        assertEvent(event, "SELECT_CHOICE");
        return event.name === INTERESTS_INPUT_KEY;
      },
      didChangeGoal: ({ event }) => {
        assertEvent(event, "SELECT_CHOICE");
        return event.name === GOALS_INPUT_KEY;
      },
      didChangePreference: ({ event }) => {
        assertEvent(event, "CHANGE");
        return QuestionIdsSchema.safeParse(event.name).success;
      },
      didChangeProfileNameInput: ({ context, event }) => {
        return event.type === "CHANGE" && event.name === PROFILE_NAME_INPUT_KEY;
      },
      didSubmitProfileName: ({ context, event }) => {
        return event.type === "SUBMIT" && event.name === PROFILE_NAME_INPUT_KEY;
      },
      didSubmitInterests: ({ event }) => {
        assertEvent(event, "SUBMIT");
        return event.name === INTERESTS_INPUT_KEY;
      },
      isProfileNameValid: ({ context, event }) => {
        return ProfileSchema.shape.profileSlug.safeParse(context.profileName)
          .success;
      },
      didChangeEmailInput: ({ context, event }) => {
        return event.type === "CHANGE" && event.name === EMAIL_INPUT_KEY;
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
        preferences: {},
        goals: [],
        interests: [],
        equipment: {},
        diet: {},
        previousSuggestedProfileNames: [],
        profileName: getRandomProfileName(),
        recentCreatedListIds: [],
        recentSharedListIds: [],
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

      ProfileRow: {
        initial: "NotExists",
        states: {
          NotExists: {
            always: {
              target: "Creating",
              guard: stateIn({ UserRow: "Created" }),
            },
          },
          Creating: {
            on: {
              RESUME: {
                target: "Creating",
                reenter: true,
              },
            },
            invoke: {
              src: "createProfile",
              input: ({ context, event }) => {
                return {
                  name: context.profileName,
                  userId: context.id,
                };
              },
              onDone: "Created",
              onError: "Error",
            },
          },
          Error: {
            entry: console.error,
          },
          Created: {
            type: "final",
          },
        },
      },

      ProfileName: {
        type: "parallel",
        states: {
          Availability: {
            initial: "Uninitialized",
            on: {
              CHANGE: {
                target: ".Inputting",
                guard: "didChangeProfileNameInput",
                actions: assign({
                  profileName: ({ event }) => event.value,
                }),
              },
              SUBMIT: {
                guard: and(["isProfileNameValid", "didSubmitProfileName"]),
                target: ".Checking",
              },
            },
            states: {
              Uninitialized: {},
              Inputting: {},
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
                      target: "Available",
                    },
                    {
                      target: "Unavailable",
                    },
                  ],
                },
              },
              Unavailable: {},
              Available: {},
            },
          },

          Submitted: {
            initial: "False",
            states: {
              False: {
                always: {
                  target: "True",
                  guard: and(["isProfileNameValid"]),
                },
              },
              True: {},
            },
          },

          Claimed: {
            initial: "False",
            states: {
              False: {
                on: {
                  SUBMIT: {
                    target: "InProgress",
                    guard: and([
                      "isProfileNameValid",
                      "didSubmitProfileName",
                      // stateIn({ ProfileName: { Availability: "Available" } }),
                      stateIn({ ProfileRow: "Created" }),
                    ]),
                  },
                },
              },
              InProgress: {
                invoke: {
                  src: "setProfileSlug",
                  onDone: "True",
                  input: ({ context }) => {
                    const profileName = context.profileName;
                    assert(
                      profileName.length,
                      "expected profile name when setting"
                    );

                    return {
                      userId: context.id,
                      profileSlug: profileName,
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
        on: {
          SELECT_CHOICE: [
            {
              guard: "didChangeInterest",
              actions: assign(({ context, event }) =>
                produce(context, (draft) => {
                  const interest = event.value;

                  if (context.interests.includes(interest)) {
                    draft.interests = context.goals.filter(
                      (g) => g !== interest
                    );
                  } else {
                    draft.interests = [...context.goals, interest];
                  }
                })
              ),
            },
            {
              guard: "didChangeGoal",
              actions: assign(({ context, event }) =>
                produce(context, (draft) => {
                  const goal = event.value as CookingGoal;

                  if (context.goals.includes(goal)) {
                    draft.goals = context.goals.filter((g) => g !== goal);
                  } else {
                    draft.goals = [...context.goals, goal];
                  }
                })
              ),
            },
          ],
          CHANGE: {
            guard: "didChangePreference",
            actions: assign({
              preferences: ({ context, event }) =>
                produce(context.preferences, (draft) => {
                  console.log(event);
                  const questionId = QuestionIdsSchema.parse(event.name);
                  console.log({ questionId }, event.value);
                  draft[questionId] = event.value;
                }),
            }),
          },
        },
        states: {
          NotStarted: {
            on: {
              PAGE_LOADED: {
                target: "Quiz",
                guard: ({ event }) => {
                  return event.pathname.startsWith("/quiz/intro");
                },
              },
            },
          },
          Quiz: {
            initial: "Intro",
            onDone: [
              {
                guard: stateIn({
                  Email: { Saved: "False" },
                }),
                target: "Email",
              },
              {
                guard: stateIn({
                  ProfileName: { Saved: "False" },
                }),
                target: "ProfileName",
              },
              {
                target: "Prompt",
              },
            ],
            states: {
              Intro: {
                on: {
                  PAGE_LOADED: {
                    target: "Goals",
                    guard: ({ event }) => {
                      return event.pathname.startsWith("/quiz/goals");
                    },
                  },
                },
              },
              Goals: {
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
                    target: "Interests",
                    guard: ({ event }) =>
                      event.pathname.startsWith("/quiz/interests"),
                  },
                },
              },
              Interests: {
                entry: spawnChild("generateSuggestedInterests", {
                  input: ({ context }) => {
                    const personalizationContext =
                      getPersonalizationContext(context);

                    return {
                      personalizationContext,
                    };
                  },
                }),
                on: {
                  SUGGESTED_INTERESTS_PROGRESS: {
                    actions: assign({
                      suggestedFeedTopics: ({ event }) => event.data.interests,
                    }),
                  },
                  SUBMIT: {
                    target: "Complete",
                    guard: "didSubmitInterests",
                  },
                },
              },
              Complete: {
                type: "final",
              },
            },
          },

          Email: {
            on: {
              CANCEL: "Prompt",
              SUBMIT: "ProfileName",
            },
          },
          ProfileName: {
            on: {
              CANCEL: "Prompt",
              SUBMIT: "Prompt",
            },
          },
          Prompt: {},
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
                  draft.recentCreatedListIds.unshift(event.id);
                })
              ),
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

const getRandomProfileName = () =>
  uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: "",
    style: "capital",
  });
