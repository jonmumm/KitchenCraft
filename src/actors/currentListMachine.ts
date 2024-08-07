import { AppEvent } from "@/types";
import { produce } from "immer";
import { assign, setup } from "xstate";

// todo this is an idea for a machien that can be invoked on both client and server
// for thigns that need to be shared twice but want tob e only written once.

export const currentListMachine = setup({
  types: {
    input: {} as {
      id: string;
    },
    events: {} as AppEvent,
    context: {} as {
      id: string;
      recipeIds: string[];
    },
  },
}).createMachine({
  id: "CurrentListMachine",
  context: ({ input }) => ({
    id: input.id,
    recipeIds: [],
  }),
  on: {
    SELECT_RECIPE: {
      actions: assign({
        recipeIds: ({ context, event }) =>
          produce(context.recipeIds, (draft) => {
            draft.push(event.id);
          }),
      }),
    },
  },
});
