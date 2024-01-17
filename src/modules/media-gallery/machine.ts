import { assert } from "@/lib/utils";
import { MediaFragmentSchema } from "@/schema";
import { AppEvent } from "@/types";
import { ActorRefFrom, SnapshotFrom, assign, createMachine } from "xstate";

type Context = {
  slug: string;
  focusedIndex: number | undefined;
  minHeight: string;
  numItems: number;
};

export const createMediaGalleryMachine = (props: Context) => {
  const { ...initialContext } = props;
  return createMachine(
    {
      id: "MediaGalleryMachine",
      context: initialContext,
      types: {
        context: {} as Context,
        events: {} as AppEvent,
        actions: {} as
          | {
              type: "replaceQueryParameters";
              params: { paramSet: Record<string, string | undefined> };
            }
          | {
              type: "scrollFocusedIntoView";
            },
      },
      type: "parallel",
      states: {
        Fullscreen: {
          initial: "False",
          states: {
            True: {
              entry: [{ type: "scrollFocusedIntoView" }],
              on: {
                CLOSE: {
                  target: "False",
                },
                BACK: {
                  target: "False",
                },
                SWIPE_UP: {
                  target: "False",
                },
                SWIPE_DOWN: {
                  target: "False",
                },
                SWIPE_RIGHT: {
                  guard: ({ context }) => {
                    assert(
                      typeof context.focusedIndex !== "undefined",
                      "expected focusedIndex"
                    );
                    return context.focusedIndex! - 1 >= 0;
                  },
                  actions: [
                    assign({
                      focusedIndex: ({ context }) => context.focusedIndex! - 1,
                    }),
                    "scrollFocusedIntoView",
                  ],
                },
                SWIPE_LEFT: {
                  guard: ({ context }) => {
                    assert(
                      typeof context.focusedIndex !== "undefined",
                      "expected focusedIndex"
                    );
                    return context.focusedIndex + 1 < context.numItems;
                  },
                  actions: [
                    assign({
                      focusedIndex: ({ context }) => context.focusedIndex! + 1,
                    }),
                    "scrollFocusedIntoView",
                  ],
                },
              },
            },
            False: {
              // entry: {
              //   type: "replaceQueryParameters",
              //   params({ context, event }) {
              //     return {
              //       paramSet: {
              //         gallery: undefined,
              //         index: undefined,
              //         slug: undefined,
              //       },
              //     };
              //   },
              // },
              on: {
                HASH_CHANGE: {
                  target: "True",
                  guard: ({ context, event }) => {
                    const result = MediaFragmentSchema.safeParse(event.hash);
                    if (result.success) {
                      return result.data.slug === context.slug;
                    }
                    return false;
                  },
                  actions: assign({
                    focusedIndex: ({ event }) =>
                      MediaFragmentSchema.parse(event.hash).index,
                  }),
                },
                // PRESS_MEDIA_THUMB: {
                //   target: "True",
                //   actions: assign({
                //     focusedIndex: ({ event }) => event.index,
                //     slug: ({ event }) => event.slug,
                //   }),
                //   guard: ({ event, context }) => {
                //     return event.slug === context.slug;
                //   },
                // },
              },
            },
          },
        },
      },
    },
    {
      actions: {
        scrollFocusedIntoView: ({ context }) => {
          const elId = `media-${context.slug}-${context.focusedIndex}`;
          console.log("scrolling to", elId);
          const el = document.getElementById(elId);
          assert(el, `couldnt find media element #${elId}`);
          setTimeout(() => {
            el.scrollIntoView({ behavior: "instant" });
          }, 0);
        },
      },
    }
  );
};

type MediaGalleryMachine = ReturnType<typeof createMediaGalleryMachine>;
export type MediaGalleryActor = ActorRefFrom<MediaGalleryMachine>;
export type MediaGallerySnapshot = SnapshotFrom<MediaGalleryActor>;
// type Context = z.infer<typeof ContextSchema>;

// type GeneratorEvent =
//   | GeneratorObervableEvent<"SUGGESTION", SuggestionPredictionOutput>
//   | GeneratorObervableEvent<"REMIX_SUGGESTIONS", SuggestionPredictionOutput>
//   | GeneratorObervableEvent<
//       "INSTANT_RECIPE_METADATA",
//       InstantRecipeMetadataPredictionOutput
//     >;

// const MediaFragmentSchema = z.preprocess((val) => {
//   if (typeof val !== 'string') return;

//   // Regular expression to match the entire pattern
//   const regex = /^#media-([a-z0-9_-]+)-(\d+)$/;
//   const match = val.match(regex);

//   if (match) {
//       return { slug: match[1], index: match[2] };
//   }
// }, z.object({
//   slug: SlugSchema,
//   index: z.string().regex(/^\d+$/, {
//       message: "Index must be a numeric value",
//   }).transform(Number) // Transform to number after validation
// }));
