import { AppEvent, SystemEvent, WithCaller } from "@/types";
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
  onboardingInput: {
    mealType: string | undefined;
  };
};

export const browserSessionMachine = setup({
  types: {
    input: {} as Input,
    context: {} as BrowserSessionContext,
    events: {} as WithCaller<AppEvent> | WithCaller<SystemEvent>,
  },
  actors: {},
  guards: {},
  actions: {},
}).createMachine({
  id: "BrowserSessionMachine",
  type: "parallel",
  context: ({ input }) => ({
    ...input,
    onboardingInput: {
      mealType: undefined,
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
      on: {
        CLOSE: ".NotStarted",
      },
      states: {
        NotStarted: {
          on: {
            START_ONBOARDING: "MealType",
          },
        },
        MealType: {
          on: {
            SELECT_VALUE: {
              target: "Exclusions",
              guard: ({ event }) => event.name === "onboarding:meal_type",
              actions: assign({
                onboardingInput: ({ context, event }) =>
                  produce(context.onboardingInput, (draft) => {
                    draft.mealType = event.value;
                  }),
              }),
            },
          },
        },
        Exclusions: {
          on: {
            NEXT: "Misc",
            CHANGE: {
              target: "Exclusions",
              guard: ({ event }) => event.name === "onboarding:exclusions",
              // actions: assign(({ context, event }) =>
              //   produce(context, (draft) => {
              //     draft.userPreferences.dietaryRestrictions = event.value;
              //     draft.modifiedPreferences.dietaryRestrictions = true;
              //   })
              // ),
            },
          },
        },
        Misc: {
          on: {
            NEXT: "Equipment",
          },
        },
        Equipment: {
          on: {
            NEXT: "Ingredients",
          },
        },
        Ingredients: {
          on: {
            NEXT: "Complete",
          },
        },
        Complete: {
          type: "final",
        },
      },
    },
  },
});
