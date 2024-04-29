import { AppEvent, OnboardingInput, SystemEvent, WithCaller } from "@/types";
import { setup } from "xstate";
import { z } from "zod";

const InputSchema = z.object({
  id: z.string(),
  userId: z.string(),
});
type Input = z.infer<typeof InputSchema>;

type BrowserSessionContext = {
  id: string;
  userId: string;
  onboardingInput: OnboardingInput;
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
    onboardingInput: {
      experienceLevel: undefined,
      equipment: {},
      preferences: {},
      diet: {},
    },
  }),
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
