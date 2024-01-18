import { assert } from "@/lib/utils";
import { MediaFragmentSchema } from "@/schema";
import { AppEvent } from "@/types";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { ActorRefFrom, SnapshotFrom, assign, fromPromise, setup } from "xstate";

type Context = {
  slug: string;
  focusedIndex: number | undefined;
  minHeight: string;
  currentFile?: File;
  currentFileMediaElement?: HTMLImageElement | HTMLVideoElement;
  currentFileSentBytes?: number;
  media: { url: string; width: number; height: number }[];
};

export const createMediaGalleryMachine = (props: Context) => {
  const { ...initialContext } = props;
  return setup({
    types: {
      context: {} as Context,
      events: {} as AppEvent,
    },
    actors: {
      uploadMedia: fromPromise(
        async ({
          input,
        }: {
          input: {
            slug: string;
            file: File;
            element: HTMLVideoElement | HTMLImageElement;
          };
        }) => {
          const { slug, file, element } = input;

          let metadata;
          if ("duration" in element) {
            metadata = {
              type: "VIDEO",
              width: element.width,
              height: element.height,
              duration: element.duration,
            };
          } else {
            metadata = {
              type: "IMAGE",
              width: element.width,
              height: element.height,
            };
          }

          return await upload(file.name, file, {
            access: "public",
            handleUploadUrl: `${window.location.origin}/recipe/${slug}/media`,
            clientPayload: JSON.stringify(metadata),
          });
        }
      ),
      loadMedia: fromPromise(({ input }: { input: File }) => {
        return new Promise<HTMLImageElement | HTMLVideoElement>(
          (resolve, reject) => {
            const file = input;
            if (file.type.startsWith("image/")) {
              const img = new Image();
              img.onload = () => resolve(img);
              img.src = URL.createObjectURL(file);
            } else if (file.type.startsWith("video/")) {
              const video = document.createElement("video");
              video.onloadedmetadata = () => resolve(video);
              video.src = URL.createObjectURL(file);
            } else {
              reject(new Error("Unsupported file type"));
            }
          }
        );
      }),
    },
    actions: {
      // sendToast: ({ context }, params: { message: string }),
      scrollFocusedIntoView: ({ context }) => {
        const elId = `media-${context.slug}-${context.focusedIndex}`;
        const el = document.getElementById(elId);
        assert(el, `couldnt find media element #${elId}`);
        setTimeout(() => {
          el.scrollIntoView({ behavior: "instant" });
        }, 0);
      },
      replaceQueryParameters: (
        { context },
        params: { paramSet: Record<string, string | undefined> }
      ) => {
        const queryParams = new URLSearchParams(window.location.search);

        for (const key in params.paramSet) {
          const value = params.paramSet[key];
          if (!!value) {
            queryParams.set(key, value);
          } else {
            queryParams.delete(key);
          }
        }

        const paramString = queryParams.toString();

        // Construct the new URL
        const newUrl =
          paramString !== ""
            ? window.location.pathname + "?" + paramString
            : window.location.pathname;
        window.history.replaceState(context, "", newUrl);
      },
    },
  }).createMachine({
    id: "MediaGalleryMachine",
    context: initialContext,
    type: "parallel",
    states: {
      Upload: {
        initial: "None",
        states: {
          None: {
            on: {
              FILE_SELECTED: {
                target: "Loading",
                guard: ({ context, event }) => {
                  return context.slug === event.slug;
                },
                actions: assign({
                  currentFile: ({ event }) => event.file,
                }),
              },
            },
          },
          Loading: {
            entry: () => toast("Uploading starting"),
            invoke: {
              src: "loadMedia",
              input: ({ context }) => {
                assert(context.currentFile, "expected file");
                return context.currentFile;
              },
              onError: "Error",
              onDone: {
                target: "InProgress",
                actions: [
                  assign({
                    currentFileMediaElement: ({ event }) => event.output,
                    media: ({ context, event }) => {
                      const el = event.output;
                      return [
                        ...context.media,
                        {
                          url: el.src,
                          height: el.height,
                          width: el.width,
                        },
                      ];
                    },
                  }),
                ],
              },
            },
          },
          InProgress: {
            invoke: {
              src: "uploadMedia",
              input: ({ context }) => {
                assert(context.currentFile, "expedted current file");
                assert(
                  context.currentFileMediaElement,
                  "expedted current media element"
                );

                return {
                  file: context.currentFile,
                  element: context.currentFileMediaElement,
                  slug: context.slug,
                };
              },
              onDone: "Complete",
              onError: "Error",
            },
          },
          Complete: {
            entry: () => toast("Upload complete"),
          },
          Error: {
            entry: () => toast("Upload error"),
          },
        },
      },
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
                  return context.focusedIndex + 1 < context.media.length;
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
  });
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
