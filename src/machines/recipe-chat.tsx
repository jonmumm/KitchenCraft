import {
  assert,
  assertType,
  getChatRecipeSlug,
  getRecipeSlug,
} from "@/lib/utils";
import { CreateRecipeInputSchema } from "@/schema";
import {
  AppClient,
  AppEvent,
  CreateChatInput,
  CreateRecipeInput,
  RecipeAttributes,
} from "@/types";
import { Message } from "ai";
import { ActorRefFrom, assign, createMachine, fromPromise } from "xstate";
import { z } from "zod";

type Context = {
  name: string | undefined;
  chatId: string;
  messages: Record<string, Message>;
  promptInput: string | undefined;
  currentRecipe:
    | {
        name: string;
        description: string;
        slug: string;
      }
    | undefined;
  attributes: RecipeAttributes;
};

export const createRecipeChatMachine = ({
  slug,
  userId,
  chatId,
  sessionId,
  trpcClient,
}: {
  sessionId: string;
  userId?: string;
  chatId: string;
  slug?: string;
  trpcClient: AppClient;
}) => {
  const initial = "New"; //  | "Created" | "Archived";

  return createMachine(
    {
      id: "RecipeChat",
      initial,
      types: {
        events: {} as AppEvent,
        context: {} as Context,
      },
      on: {
        SET_INPUT: {
          actions: assign({
            promptInput: ({ event }) => event.value,
          }),
        },
      },
      context: {
        name: undefined,
        chatId,
        currentRecipe: undefined,
        promptInput: undefined,
        messages: {},
        attributes: {
          ingredients: {},
          techniques: {},
          cuisines: {},
          cookware: {},
        },
      },
      states: {
        New: {
          initial: "Untouched",
          onDone: "Created",
          states: {
            Untouched: {
              always: [{ target: "Touched", guard: "hasTouchedAttributes" }],
            },
            Touched: {
              always: [
                { target: "Untouched", guard: "hasNoTouchedAttributes" },
              ],
              on: {
                SUBMIT: "Submitted",
              },
            },
            Submitted: {
              on: {
                SELECT_RECIPE: {
                  target: "Selecting",
                },
              },
            },
            Selecting: {
              on: {
                SELECT_RECIPE: {
                  target: "Creating",
                  actions: assign({
                    currentRecipe: ({ context, event }) => ({
                      description: event.description,
                      name: event.name,
                      slug: getChatRecipeSlug(context.chatId, event.name),
                    }),
                  }),
                },
              },
            },
            Creating: {
              invoke: {
                input: ({ context }) => {
                  assert(
                    context.currentRecipe,
                    "expected currentRecipe to be set when creating"
                  );

                  return {
                    name: context.currentRecipe.name,
                    description: context.currentRecipe?.description,
                    chatId: context.chatId,
                    slug: getChatRecipeSlug(
                      context.chatId,
                      context.currentRecipe.name
                    ),
                    messages: [],
                  } satisfies CreateRecipeInput;
                },
                src: fromPromise(({ input }) =>
                  trpcClient.createRecipe.mutate(input)
                ),
                onDone: "Viewing",
                onError: "Error",
              },
            },
            Viewing: {},
            Error: {
              entry: console.error,
            },
          },
        },
        Created: {},
        Archived: {},
      },
    },
    {
      guards: {
        hasTouchedAttributes,
        hasNoTouchedAttributes,
      },
    }
  );
};

type RecipeChatMachine = ReturnType<typeof createRecipeChatMachine>;
export type RecipeChatActor = ActorRefFrom<RecipeChatMachine>;

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

// Helper function to check if attributes have not been touched
const hasNoTouchedAttributes = ({ context }: { context: Context }) => {
  return !hasTouchedAttributes({ context });
};
