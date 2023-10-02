import { getUniqueSlug } from "@/lib/utils";
import { RecipeAttribute, RecipeAttributes } from "@/types";
import { ActorRefFrom, assign, createMachine, fromPromise } from "xstate";

type Context = {
  slug: string | undefined;
  attributes: RecipeAttributes;
};

type Event =
  | {
      type: "TOGGLE_ATTRIBUTE";
      attrType: RecipeAttribute;
      attrKey?: string;
    }
  | {
      type: "UPDATE_PROMPT";
      prompt?: string;
    }
  | {
      type: "SUBMIT";
    }
  | {
      type: "SELECT_RECIPE";
      name: string;
      description: string;
    }
  | { type: "BACK" };

export const createRecipeChatMachine = ({
  slug,
  userId,
  sessionId,
}: {
  sessionId: string;
  userId?: string;
  slug?: string;
}) => {
  const initial = "New"; //  | "Created" | "Archived";

  return createMachine(
    {
      id: "RecipeChat",
      initial,
      types: {
        events: {} as Event,
        context: {} as Context,
      },
      context: {
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
          on: {
            SELECT_RECIPE: {
              target: "Created",
              actions: [
                assign({
                  slug: ({ event }) => getUniqueSlug(event.name),
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
      // states: {
      //   Inputting: {},
      //   Selecting: {
      //     on: {
      //       SELECT_RECIPE: {
      //         target: "Chatting",
      //         actions: [
      //           assign({
      //             slug: ({ event }) => getUniqueSlug(event.name),
      //           }),
      //         ],
      //       },
      //     },
      //   },
      //   Chatting: {},
      // },
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
