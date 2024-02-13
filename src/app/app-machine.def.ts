import { AppEvent } from "@/types";
import { setup } from "xstate";
import { z } from "zod";

const craftMachine = setup({
  types: {
    context: {} as {
      prompt: string;
    },
    events: {} as AppEvent,
  },
}).createMachine({
  id: "CraftMachine",
  context: {
    prompt: "",
  },
  type: "parallel",
  states: {
    Generators: {
      type: "parallel",
      states: {
        Tags: {},
        Ingredients: {},
        Recipes: {},
      },
    },
  },
  on: {
    // ADD_INGREDIENT
    // ADJUST_OPTION: {
    //   actions: assign(({ context, event }) => {
    //     return produce(context, (next) => {
    //       // @ts-expect-error
    //       next[event.option] = event.value;
    //     });
    //   }),
    // },
  },
});

const InputSchema = z.object({
  id: z.string(),
});
type Input = z.infer<typeof InputSchema>;

export const userAppMachine = setup({
  types: {
    input: {} as Input,
    context: {} as {
      distinctId: string;
    },
    events: {} as AppEvent,
  },
  actors: {
    craftMachine,
  },
}).createMachine({
  id: "UserAppMachine",
  context: ({ input }) => ({
    distinctId: input.id,
  }),
  type: "parallel",
  states: {
    Craft: {
      invoke: {
        id: "Craft",
        src: "craftMachine",
        onSnapshot: {
          // This is needed just to allow .subscribe
          // to get callbacks when machine changes
          // todo file question with xstate
        },
      },
    },
  },
});
