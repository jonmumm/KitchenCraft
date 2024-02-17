import { AppEvent } from "@/types";
import { sendTo, setup } from "xstate";
import { z } from "zod";

const craftMachine = setup({
  types: {
    context: {} as {
      prompt: string;
    },
    events: {} as AppEvent,
  },
  actors: {
    generateWithLLM: setup({
      types: {
        events: {} as AppEvent,
        input: {} as {
          prompt: string;
          type: "tags" | "ingredients" | "recipes";
        },
      },
    }).createMachine({
      id: "generateWithLLM",
      initial: "Idle",
      states: {
        Idle: {
          on: {
            SET_INPUT: {
              target: "Holding",
              actions: ({ event }) => {
                console.log("SI", event);
              },
              guard: ({ context, event }) => !!event.value?.length,
            },
          },
        },
        Holding: {
          entry: () => {
            console.log("HOLDING");
          },
        },
        InProgress: {
          onDone: "Idle",
        },
      },
    }),
  },
}).createMachine({
  id: "CraftMachine",
  context: {
    prompt: "",
  },
  type: "parallel",
  on: {
    SET_INPUT: {
      actions: [
        sendTo("tagSuggestionsGenerator", ({ event }) => event),
        sendTo("ingredientSuggestionsGenerator", ({ event }) => event),
        sendTo("recipeSuggestionsGenerator", ({ event }) => event),
      ],
    },
  },
  states: {
    Generators: {
      type: "parallel",
      states: {
        Tags: {
          entry: () => {
            console.log("tags");
          },
          invoke: {
            src: "generateWithLLM",
            id: "tagSuggestionsGenerator",
            input: ({ context }) => ({
              prompt: context.prompt,
              type: "tags",
            }),
            onSnapshot: {
              // needed to trigger updates
            },
          },
        },
        Ingredients: {
          invoke: {
            id: "ingredientSuggestionsGenerator",
            src: "generateWithLLM",
            input: ({ context }) => ({
              prompt: context.prompt,
              type: "ingredients",
            }),
            onSnapshot: {
              // needed to trigger updates
            },
          },
        },
        Recipes: {
          invoke: {
            src: "generateWithLLM",
            id: "recipeSuggestionsGenerator",
            input: ({ context }) => ({
              prompt: context.prompt,
              type: "recipes",
            }),
            onSnapshot: {
              // needed to trigger updates
            },
          },
        },
      },
    },
  },
});

const InputSchema = z.object({
  id: z.string(),
});
type Input = z.infer<typeof InputSchema>;

export const sessionMachine = setup({
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
  on: {
    SET_INPUT: {
      actions: sendTo("craftActor", ({ event }) => event),
    },
  },
  states: {
    Craft: {
      invoke: {
        id: "craftActor",
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
