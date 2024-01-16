import { AppEvent } from "@/types";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ActorRefFrom, SnapshotFrom, createMachine } from "xstate";
import { Context } from "./types";

export const createGalleryMachine = ({
  open,
  router,
  currentSlug,
}: {
  router: AppRouterInstance;
  open: boolean;
  currentSlug?: string;
}) => {
  const context: Context = {
    currentSlug,
  };

  return createMachine(
    {
      id: "GalleryMachine",
      context,
      types: {
        context: {} as Context,
        events: {} as AppEvent,
        guards: {} as {
          type: "isInputFocused";
        },
        // actors: {} as
        //   | {
        //       src: "instantRecipeMetadataGenerator";
        //       logic: typeof instantRecipeMetadataGenerator;
        //     }
        //   | {
        //       src: "remixSuggestionsGenerator";
        //       logic: typeof remixSuggestionsGenerator;
        //     }
        //   | {
        //       src: "suggestionsGenerator";
        //       logic: typeof suggestionsGenerator;
        //     }
        //   | {
        //       src: "createNewInstantRecipe";
        //       logic: typeof createNewInstantRecipe;
        //     }
        //   | {
        //       src: "createNewRecipeFromSuggestion";
        //       logic: typeof createNewRecipeFromSuggestion;
        //     },
        //   | {
        //       src: "suggestionsGenerator";
        //       logic: typeof suggestionsGenerator;
        //     }
        // actions: {} as
        //   | {
        //       type: "assignPrompt";
        //       params: { prompt: string | undefined };
        //     }
        //   | {
        //       type: "replaceQueryParameters";
        //       params: { paramSet: Record<string, string | undefined> };
        //     }
        //   | {
        //       type: "pushQueryParameters";
        //       params: { paramSet: Record<string, string | undefined> };
        //     }
        //   | {
        //       type: "focusInput";
        //     },
      },
      on: {},
      type: "parallel",
      states: {
        Open: {
          initial: open ? "True" : "False",
          states: {
            True: {},
            False: {},
          },
        },
      },
    },
    {}
  );
};

type GalleryMachine = ReturnType<typeof createGalleryMachine>;
export type GalleryActor = ActorRefFrom<GalleryMachine>;
export type GallerySnapshot = SnapshotFrom<GalleryActor>;
// type Context = z.infer<typeof ContextSchema>;

// type GeneratorEvent =
//   | GeneratorObervableEvent<"SUGGESTION", SuggestionPredictionOutput>
//   | GeneratorObervableEvent<"REMIX_SUGGESTIONS", SuggestionPredictionOutput>
//   | GeneratorObervableEvent<
//       "INSTANT_RECIPE_METADATA",
//       InstantRecipeMetadataPredictionOutput
//     >;
