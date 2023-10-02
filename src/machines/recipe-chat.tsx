import { getUniqueSlug } from "@/lib/utils";
import { AppClient, AppEvent, RecipeAttributes } from "@/types";
import { ActorRefFrom, assign, createMachine, fromPromise } from "xstate";

type Context = {
  name: string | undefined;
  slug: string | undefined;
  promptInput: string | undefined;
  attributes: RecipeAttributes;
};

export const createRecipeChatMachine = ({
  slug,
  userId,
  sessionId,
  trpcClient,
}: {
  sessionId: string;
  userId?: string;
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
        promptInput: undefined,
        slug,
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
          states: {
            Untouched: {
              always: [{ target: "Touched", guard: "hasTouchedAttributes" }],
            },
            Touched: {
              always: [
                { target: "Untouched", guard: "hasNoTouchedAttributes" },
              ],
              on: {
                SUBMIT: "Creating",
              },
            },
            Creating: {
              invoke: {
                src: fromPromise(async () => {
                  const data = await trpcClient.getData.query(undefined);
                  console.log({ data });
                  // todo create with api call..
                  // trpcClient
                  return {};
                }),
                onDone: "Created",
                onError: "Error",
              },
            },
            Error: {},
            Created: {
              type: "final",
            },
          },
          on: {
            SELECT_RECIPE: {
              target: "Created",
              actions: [
                assign({
                  slug: ({ event }) => getUniqueSlug(event.name),
                  name: ({ event }) => event.name,
                }),
              ],
            },
          },
        },
        Creating: {
          invoke: {
            src: fromPromise(async () => {
              // make API call
              return {};
            }),
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
