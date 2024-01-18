import { assert } from "@/lib/utils";
import { AppEvent } from "@/types";
import { toast } from "sonner";
import { ActorRefFrom, SnapshotFrom, assign, fromPromise, setup } from "xstate";
import { Actions } from "./actions";
import { selectHasInput } from "./selectors";

export type Context = {
  slug: string;
  comments: {
    id: number;
    comment: string;
    mediaIds: string[] | null;
    authorSlug: string | null;
    createdAt: Date;
  }[];
  newComment?: string;
};

export const createRecipeCommentsMachine = (
  props: Context,
  actions: Actions
) => {
  const { ...initialContext } = props;
  return setup({
    types: {
      context: {} as Context,
      events: {} as AppEvent,
    },
    actors: {
      postComment: fromPromise(
        async ({
          input,
        }: {
          input: { comment: string; mediaIds: string[] | null };
        }) => {
          const { comment, mediaIds } = input;
          return await actions.postComment(comment, mediaIds);
        }
      ),
    },
  }).createMachine({
    id: "RecipeCommentsMachine",
    context: initialContext,
    type: "parallel",
    states: {
      NewComment: {
        type: "parallel",
        initial: "Inputting",
        on: {
          CHANGE: {
            guard: ({ event }) => event.name === "newComment",
            actions: assign({
              newComment: ({ event }) => event.value,
            }),
          },
        },
        states: {
          Inputting: {
            initial: "Pristine",
            states: {
              Pristine: {
                initial: "Yes",
                states: {
                  No: {
                    always: {
                      target: "Yes",
                      guard: ({ context }) => selectHasInput({ context }),
                    },
                  },
                  Yes: {
                    always: {
                      target: "No",
                      guard: ({ context }) => !selectHasInput({ context }),
                    },
                  },
                },
              },
            },
          },
          Submitting: {
            initial: "No",
            states: {
              No: {
                on: {
                  SUBMIT: {
                    actions: () => {
                      console.log("SUBMIT");
                    },
                    guard: ({ context }) => selectHasInput({ context }),
                    target: "Yes",
                  },
                },
              },
              Yes: {
                invoke: {
                  src: "postComment",
                  input: ({ context, event }) => {
                    console.log("SUBMITITTING!");
                    assert(context.newComment, "expected newComment");

                    return {
                      comment: context.newComment,
                      mediaIds: null,
                    };
                  },
                  onDone: "No",
                  onError: {
                    target: "No",
                    actions: () => {
                      toast(
                        "There was an error posting your comment. Please try again."
                      );
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
};

type RecipeCommentsMachine = ReturnType<typeof createRecipeCommentsMachine>;
export type RecipeCommentsActor = ActorRefFrom<RecipeCommentsMachine>;
export type RecipeCommentsSnapshot = SnapshotFrom<RecipeCommentsActor>;
