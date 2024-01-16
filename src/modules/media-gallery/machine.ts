import { assert } from "@/lib/utils";
import { MediaFragmentSchema } from "@/schema";
import { AppEvent } from "@/types";
import { ActorRefFrom, SnapshotFrom, assign, createMachine } from "xstate";

type Context = {
  slug: string;
  focusedIndex: number | undefined;
  minHeight: string;
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
        actions: {} as {
          type: "replaceQueryParameters";
          params: { paramSet: Record<string, string | undefined> };
        },
      },
      type: "parallel",
      states: {
        Fullscreen: {
          initial: "False",
          states: {
            True: {
              entry: [
                ({ context }) => {
                  const elId = `media-${context.slug}-${context.focusedIndex}`;
                  const el = document.getElementById(elId);
                  assert(el, "couldnt find media element");
                  setTimeout(() => {
                    el.scrollIntoView();
                  }, 0);
                },
              ],
              on: {
                CLOSE: {
                  target: "False",
                },
                BACK: {
                  target: "False",
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
    {}
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
