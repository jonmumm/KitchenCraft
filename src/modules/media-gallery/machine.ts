import { AppEvent } from "@/types";
import { ActorRefFrom, SnapshotFrom, createMachine } from "xstate";

type Context = {
  slug: string;
  focusedIndex: number | undefined;
};

export const createMediaGalleryMachine = (props: {
  fullscreen: boolean;
  slug: string;
  focusedIndex: number;
}) => {
  return createMachine(
    {
      id: "MediaGalleryMachine",
      context: {
        slug: props.slug,
        focusedIndex: props.focusedIndex,
      },
      types: {
        context: {} as Context,
        events: {} as AppEvent,
      },
      on: {
        PRESS_MEDIA_THUMB: {
          actions: (e) => {
            console.log(e);
          },
        },
      },
      type: "parallel",
      states: {
        Fullscreen: {
          initial: props.fullscreen ? "True" : "False",
          states: {
            True: {
              on: {
                BACK: {
                  target: "False",
                },
              },
            },
            False: {
              on: {
                PRESS_MEDIA_THUMB: {
                  target: "True",
                  guard: ({ event, context }) => {
                    return event.slug === context.slug;
                  },
                },
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
