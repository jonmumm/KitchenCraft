import { preferencesDisplayNames } from "@/data/settings";
import { streamToObservable } from "@/lib/stream-to-observable";
import { assert } from "@/lib/utils";
import {
  AppEvent,
  DietSettings,
  EquipmentSettings,
  ExperienceLevel,
  SystemEvent,
  TasteSettings,
  WithCaller,
} from "@/types";
import { produce } from "immer";
import { from, switchMap } from "rxjs";
import { assign, fromEventObservable, setup } from "xstate";
import { z } from "zod";
import {
  SuggestIngredientStream,
  SuggestIngredientsEvent,
  SuggestIngredientsOutputSchema,
} from "./suggest-ingredients.stream";
import {
  SuggestTagsEvent,
  SuggestTagsOutputSchema,
  SuggestTagsStream,
} from "./suggest-tags.stream";

const InputSchema = z.object({
  id: z.string(),
  userId: z.string(),
});
type Input = z.infer<typeof InputSchema>;

type BrowserSessionContext = {
  id: string;
  userId: string;
  experienceLevel?: ExperienceLevel;
  equipment: EquipmentSettings;
  diet: DietSettings;
  preferences: TasteSettings;
  timezone?: string;
  country?: string;
  continent?: string;
  city?: string;
  postalCode?: string;
  gps?: {
    latitude: string;
    longitude: string;
  };
  region?: string;
  regionCode?: string;
  suggestedIngredients: Array<string>;
  suggestedTags: Array<string>;
  lastRunPersonalizaitonContext: string | undefined; // todo put this on the store instead of context?
};

export const browserSessionMachine = setup({
  types: {
    input: {} as Input,
    context: {} as BrowserSessionContext,
    events: {} as
      | WithCaller<AppEvent>
      | WithCaller<SystemEvent>
      | SuggestTagsEvent
      | SuggestIngredientsEvent,
  },
  actors: {
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
    suggestedIngredients: [],
    suggestedTags: [],
    lastRunPersonalizaitonContext: undefined,
  }),
  on: {
    EXPERIENCE_CHANGE: {
      actions: assign({
        experienceLevel: ({ event, context }) => event.experience,
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
    SUGGEST_TAGS_PROGRESS: {
      actions: assign(({ context, event }) =>
        produce(context, (draft) => {
          if (event.data.tags) {
            draft.suggestedTags = event.data.tags;
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
        CONNECT: {
          actions: assign(({ context, event }) => {
            return produce(context, (draft) => {
              if (event.requestInfo?.continent) {
                draft.continent = event.requestInfo?.continent;
              }
              if (event.requestInfo?.latitude && event.requestInfo.longitude) {
                draft.gps = {
                  latitude: event.requestInfo.latitude,
                  longitude: event.requestInfo.longitude,
                };
              }

              if (event.requestInfo?.postalCode) {
                draft.postalCode = event.requestInfo.postalCode;
              }

              if (event.requestInfo?.country) {
                draft.country = event.requestInfo.country;
              }

              if (event.requestInfo?.region) {
                draft.region = event.requestInfo.region;
              }

              if (event.requestInfo?.regionCode) {
                draft.regionCode = event.requestInfo.regionCode;
              }

              if (event.requestInfo?.city) {
                draft.city = event.requestInfo.city;
              }

              if (event.requestInfo?.timezone) {
                draft.timezone = event.requestInfo.timezone;
              }
            });
          }),
        },
      },
    },
    Suggestions: {
      type: "parallel",
      // this is probably runnin a little too frequently
      always: {
        target: [".Ingredients.Running", ".Tags.Running"],
        actions: assign({
          lastRunPersonalizaitonContext: ({ context }) =>
            getPersonalizationContext(context),
        }),
        guard: ({ context }) =>
          !!context.lastRunPersonalizaitonContext &&
          context.lastRunPersonalizaitonContext !==
            getPersonalizationContext(context),
      },
      states: {
        Ingredients: {
          initial: "Idle",
          states: {
            Idle: {
              on: {
                CONNECT: {
                  target: "Running",
                  guard: ({ event }) => !!event.requestInfo,
                },
              },
            },
            Running: {
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
                CONNECT: {
                  target: "Running",
                  guard: ({ event }) => !!event.requestInfo,
                },
              },
            },
            Running: {
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
              guard: ({ context, event }) => {
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

type PersonalizationOptions = Pick<
  BrowserSessionContext,
  | "experienceLevel"
  | "equipment"
  | "diet"
  | "preferences"
  | "country"
  | "region"
  | "city"
  | "timezone"
>;

function getTimeContext(timezone: string): string {
  const now = new Date();

  const optionsDate: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  };
  const formattedDate = new Intl.DateTimeFormat("en-US", optionsDate).format(
    now
  );

  const optionsTime: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  };
  const formattedTime = new Intl.DateTimeFormat("en-US", optionsTime).format(
    now
  );

  const optionsDayOfWeek: Intl.DateTimeFormatOptions = {
    weekday: "long",
    timeZone: timezone,
  };
  const dayOfWeek = new Intl.DateTimeFormat("en-US", optionsDayOfWeek).format(
    now
  );

  return `Date: ${formattedDate}\nTime of Day: ${formattedTime}\nDay of Week: ${dayOfWeek}`;
}

function getPersonalizationContext(options: PersonalizationOptions): string {
  let context: string[] = [];

  if (options.experienceLevel) {
    context.push(`Experience Level: ${options.experienceLevel}`);
  }

  if (options.equipment) {
    const equipmentKeys = Object.keys(options.equipment) as Array<
      keyof typeof options.equipment
    >;
    const availableEquipment = equipmentKeys.filter(
      (key) => options.equipment[key]
    );
    if (availableEquipment.length > 0) {
      context.push(`Available Equipment: ${availableEquipment.join(", ")}`);
    }
  }

  if (options.diet) {
    const dietKeys = Object.keys(options.diet) as Array<
      keyof typeof options.diet
    >;
    const dietaryRestrictions = dietKeys.filter((key) => options.diet[key]);
    if (dietaryRestrictions.length > 0) {
      context.push(`Dietary Restrictions: ${dietaryRestrictions.join(", ")}`);
    }
  }

  if (options.preferences) {
    const tasteKeys = Object.keys(options.preferences) as Array<
      keyof typeof options.preferences
    >;
    const tastePreferences = tasteKeys.filter(
      (key) => options.preferences[key] !== undefined
    ); // Changed to check for undefined
    if (tastePreferences.length > 0) {
      const preferenceDescriptions = tastePreferences.map((key) => {
        const setting = options.preferences[key];
        return `${preferencesDisplayNames[key]}: ${setting ? "Yes" : "No"}`; // Show Yes/No based on boolean
      });
      context.push(`Taste Preferences: ${preferenceDescriptions.join(", ")}`);
    }
  }

  if (options.city || options.country || options.timezone) {
    context.push(
      `Location: ${[options.city, options.region, options.country]
        .filter(Boolean)
        .join(", ")}${
        options.timezone ? ", Timezone: " + options.timezone : ""
      }`
    );
  }

  return context.join("\n");
}
