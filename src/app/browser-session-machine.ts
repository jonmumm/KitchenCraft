import {
  AppEvent,
  DietSettings,
  EquipmentSettings,
  ExperienceLevel,
  PreferenceSettings,
  SystemEvent,
  WithCaller,
} from "@/types";
import { produce } from "immer";
import { assign, setup } from "xstate";
import { z } from "zod";

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
  preferences: PreferenceSettings;
};

export const browserSessionMachine = setup({
  types: {
    input: {} as Input,
    context: {} as BrowserSessionContext,
    events: {} as WithCaller<AppEvent> | WithCaller<SystemEvent>,
  },
  actors: {},
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
              target: "Equipment",
              guard: ({ event }) =>
                event.pathname.startsWith("/quiz/equipment"),
            },
          },
        },
        Equipment: {
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
              target: "Preferences",
              guard: ({ event }) =>
                event.pathname.startsWith("/quiz/preferences"),
            },
          },
        },
        Preferences: {
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
