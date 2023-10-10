import { assertType } from "@/lib/utils";
import {
  AppClient,
  AppEvent,
  CreateRecipeInput,
  Message,
  Recipe,
  RecipeAttributes,
  RecipeChatInput,
} from "@/types";
import { createContext } from "react";
import { ActorRefFrom, assign, createMachine, fromPromise } from "xstate";

type Context = {
  recipe: Partial<Recipe>;
  chatId: string;
  promptInput: string;
  currentQuery: string | undefined;
  currentSelection?: {
    name: string;
    description: string;
  };
  recipeMessages: Message[];
  attributes: RecipeAttributes;
};

export const createRecipeChatMachine = ({
  initialStatus,
  trpcClient,
}: {
  initialStatus: "New" | "Viewing";
  trpcClient: AppClient;
}) => {
  const createRecipe = fromPromise(
    async ({ input }: { input: CreateRecipeInput }) =>
      trpcClient.createRecipe.mutate(input)
  );

  return createMachine(
    {
      id: "RecipeChat",
      types: {
        input: {} as RecipeChatInput,
        events: {} as AppEvent,
        context: {} as Context,
        actors: {} as {
          src: "createRecipe";
          logic: typeof createRecipe;
        },
      },
      type: "parallel",
      on: {
        SET_INPUT: {
          actions: assign({
            promptInput: ({ event }) => event.value,
          }),
        },
      },
      context: ({ input: { recipe, chatId, recipeMessages } }) => ({
        recipe: {
          ...recipe,
        },
        chatId,
        recipeMessages,
        currentSelection: undefined,

        // todo pull these from search state and add to input
        promptInput: "",
        currentQuery: undefined,
        attributes: {
          ingredients: {},
          techniques: {},
          cuisines: {},
          cookware: {},
        },
      }),
      states: {
        Focus: {
          initial: "None",
          states: {
            None: {
              on: {
                FOCUS_PROMPT: {
                  target: "Input",
                },
              },
            },
            Input: {},
          },
        },
        Configurator: {
          initial: "Closed",
          states: {
            Open: {
              on: {
                TOGGLE_CONFIGURATOR: "Closed",
                CLOSE_CONFIGURATOR: "Closed",
              },
            },
            Closed: {
              on: {
                TOGGLE_CONFIGURATOR: "Open",
              },
            },
          },
        },
        Status: {
          initial: initialStatus,
          states: {
            New: {
              initial: "Untouched",
              type: "parallel",
              onDone: "Viewing",
              on: {
                START_OVER: {
                  actions: assign({
                    promptInput: () => "",
                    currentSelection: () => undefined,
                    // any other context properties you want to reset
                  }),
                  target: [".TouchState.Untouched", ".Stage.WaitingForInput"],
                },
              },
              states: {
                TouchState: {
                  initial: "Untouched",
                  states: {
                    Untouched: {
                      always: [
                        { target: "Touched", guard: "hasTouchedAttributes" },
                      ],
                    },
                    Touched: {
                      always: [
                        {
                          target: "Untouched",
                          guard: "hasNoTouchedAttributes",
                        },
                      ],
                    },
                  },
                },
                Stage: {
                  initial: "WaitingForInput",
                  states: {
                    WaitingForInput: {
                      on: {
                        SUBMIT: {
                          target: "Selecting",
                        },
                      },
                    },
                    Selecting: {
                      on: {
                        SELECT_RECIPE: {
                          target: "CreatingRecipe",
                          actions: assign({
                            currentSelection: ({ event }) => ({
                              name: event.name,
                              description: event.description,
                            }),
                          }),
                        },
                      },
                    },
                    CreatingRecipe: {
                      invoke: {
                        input: ({ context, event }) => {
                          assertType(event, "SELECT_RECIPE");
                          const { description, name } = event;
                          return {
                            chatId: context.chatId,
                            description,
                            name,
                          };
                        },
                        src: "createRecipe",
                        onDone: {
                          target: "Created",
                          actions: assign({
                            recipe: ({ event }) => event.output.recipe,
                          }),
                        },
                        onError: "Error",
                      },
                    },
                    Created: {
                      type: "final",
                    },
                    Error: {
                      entry: console.error,
                    },
                  },
                },
              },
            },
            Viewing: {},
          },
        },
      },
    },
    {
      guards: {
        hasTouchedAttributes,
        hasNoTouchedAttributes,
      },
      actors: {
        createRecipe,
      },
    }
  );
};

// Helper function to check if attributes have not been touched
const hasNoTouchedAttributes = ({ context }: { context: Context }) => {
  return !hasTouchedAttributes({ context });
};

const hasTouchedAttributes = (props: { context: Context }) => {
  if (props.context.promptInput && props.context.promptInput !== "") {
    return true;
  }

  // Check for any record with a value of true
  const hasTrueRecord = Object.values(props.context.attributes).some(
    (attribute) => {
      if (typeof attribute === "object") {
        return Object.values(attribute).some((value) => value === true);
      }
      return false; // If not an object, it doesn't match our criteria for now
    }
  );

  // Check for any attribute with a non-undefined value
  const hasNonUndefinedValue = Object.values(props.context.attributes).some(
    (attribute) => {
      return typeof attribute === "string";
    }
  );

  return hasTrueRecord || hasNonUndefinedValue;
};

type RecipeChatMachine = ReturnType<typeof createRecipeChatMachine>;
export type RecipeChatActor = ActorRefFrom<RecipeChatMachine>;

export const RecipeChatContext = createContext({} as RecipeChatActor);
