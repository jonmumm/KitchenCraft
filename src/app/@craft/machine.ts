import { eventSourceToGenerator } from "@/lib/generator";
import { assert, getObjectHash, isMobile } from "@/lib/utils";
import {
  IdeasPredictionOutputSchema,
  InstantRecipeMetadataPredictionOutputSchema,
  RecipePathSchema,
  SubstitutionsPredictionOutputSchema,
  SuggestionPredictionOutputSchema,
  SuggestionsInputSchema,
} from "@/schema";
import {
  AppEvent,
  DietaryAlternativesInput,
  EquipmentAdaptationsInput,
  InstantRecipeMetdataInput,
  SubstitutionsInput,
  SubstitutionsPredictionPartialOutput,
  SuggestionPredictionPartialOutput,
  SuggestionsInput,
} from "@/types";
import { parseAsString } from "next-usequerystate";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { RefObject } from "react";
import { assign, createMachine, fromEventObservable } from "xstate";
import { ingredientsParser, tagsParser } from "../parsers";
import { Context, GeneratorEvent } from "./types";

export const createCraftMachine = (
  searchParams: Record<string, string>,
  router: AppRouterInstance,
  scrollViewRef: RefObject<HTMLDivElement>,
  slug?: string
) => {
  // const prompt = parseAsString.parse(searchParams["prompt"]);

  const initialContext = (() => {
    const prompt = parseAsString.parseServerSide(searchParams["prompt"]);
    const ingredients =
      searchParams["ingredients"] &&
      ingredientsParser.parseServerSide(searchParams["ingredients"]);
    const tags =
      searchParams["tags"] && tagsParser.parseServerSide(searchParams["tags"]);

    return {
      prompt: prompt || undefined,
      ingredients: ingredients || undefined,
      tags: tags || undefined,
      slug: slug || null,
      suggestions: null,
      substitutions: undefined,
      dietaryAlternatives: undefined,
      equipmentAdaptations: undefined,
      scrollViewRef,
      resultId: null,
      submittedInputHash: undefined,
    } satisfies Context;
  })();

  const { prompt, ingredients, tags } = initialContext;

  const initialOpenState = !!searchParams["crafting"] ? "Open" : "Closed";
  const initialMode = "New";

  const getSubstitutionsEventSource = (input: SubstitutionsInput) => {
    const eventSourceUrl = `/api/recipe/${input.slug}/substitutions`;
    return new EventSource(eventSourceUrl);
  };

  const getInstantRecipeMetadataEventSource = (input: SuggestionsInput) => {
    const params = new URLSearchParams();
    if (input.prompt) params.set("prompt", input.prompt);

    const eventSourceUrl = `/api/instant-recipe?${params.toString()}`;
    return new EventSource(eventSourceUrl);
  };

  const getSuggestionsEventSource = (input: SuggestionsInput) => {
    const params = new URLSearchParams();
    if (input.prompt) params.set("prompt", input.prompt);
    if (input.ingredients)
      params.set("ingredients", ingredientsParser.serialize(input.ingredients));
    if (input.tags) params.set("tags", tagsParser.serialize(input.tags));

    const eventSourceUrl = `/api/suggestions?${params.toString()}`;
    return new EventSource(eventSourceUrl);
  };

  const getDietaryAlternativesEventSource = (input: SubstitutionsInput) => {
    const eventSourceUrl = `/api/recipe/${input.slug}/dietary-alternatives`;
    return new EventSource(eventSourceUrl);
  };

  const getEquipmentAdaptationsEventSource = (input: SubstitutionsInput) => {
    const eventSourceUrl = `/api/recipe/${input.slug}/equipment-adaptations`;
    return new EventSource(eventSourceUrl);
  };

  const equipmentAdaptationsGenerator = fromEventObservable(
    ({ input }: { input: EquipmentAdaptationsInput }) => {
      const source = getEquipmentAdaptationsEventSource(input);
      return eventSourceToGenerator(
        source,
        "EQUIPMENT_ADAPTATIONS",
        IdeasPredictionOutputSchema
      );
    }
  );

  const dietaryAlternativesGenerator = fromEventObservable(
    ({ input }: { input: DietaryAlternativesInput }) => {
      const source = getDietaryAlternativesEventSource(input);
      return eventSourceToGenerator(
        source,
        "DIETARY_ALTERNATIVES",
        IdeasPredictionOutputSchema
      );
    }
  );

  const substitutionsGenerator = fromEventObservable(
    ({ input }: { input: SubstitutionsInput }) => {
      const source = getSubstitutionsEventSource(input);
      return eventSourceToGenerator(
        source,
        "SUBSTITUTIONS",
        SubstitutionsPredictionOutputSchema
      );
    }
  );

  const instantRecipeMetadataGenerator = fromEventObservable(
    ({ input }: { input: InstantRecipeMetdataInput }) => {
      const source = getInstantRecipeMetadataEventSource(input);
      return eventSourceToGenerator(
        source,
        "INSTANT_RECIPE_METADATA",
        InstantRecipeMetadataPredictionOutputSchema
      );
    }
  );

  const suggestionsGenerator = fromEventObservable(
    ({ input }: { input: SuggestionsInput }) => {
      const source = getSuggestionsEventSource(input);
      return eventSourceToGenerator(
        source,
        "SUGGESTION",
        SuggestionPredictionOutputSchema
      );
    }
  );

  return createMachine(
    {
      id: "CraftMachine",
      context: initialContext,
      types: {
        context: {} as Context,
        events: {} as AppEvent | GeneratorEvent,
        guards: {} as
          | {
              type: "didNavigateToRecipe";
              params: {
                pathname: string;
              };
            }
          | {
              type: "didCompleteSubstitutions";
            }
          | {
              type: "didCompleteDietaryAlternatives";
            }
          | {
              type: "didCompleteEquipmentAdaptations";
            }
          | {
              type: "hasPristineInput";
            }
          | {
              type: "hasDirtyInput";
            },
        actors: {} as
          | {
              src: "instantRecipeMetadataGenerator";
              logic: typeof instantRecipeMetadataGenerator;
            }
          | {
              src: "suggestionsGenerator";
              logic: typeof suggestionsGenerator;
            }
          | {
              src: "substitutionsGenerator";
              logic: typeof substitutionsGenerator;
            }
          | {
              src: "dietaryAlternativesGenerator";
              logic: typeof dietaryAlternativesGenerator;
            }
          | {
              src: "equipmentAdaptationsGenerator";
              logic: typeof equipmentAdaptationsGenerator;
            },
        actions: {} as
          | {
              type: "assignResultId";
              params: { resultId: string | null };
            }
          | {
              type: "assignTags";
              params: { tags: string[] | undefined };
            }
          | {
              type: "assignDietaryAlternatives";
              params: { dietaryAlternatives: string[] | undefined };
            }
          | {
              type: "assignEquipmentAdaptations";
              params: { equipmentAdaptations: string[] | undefined };
            }
          | {
              type: "assignSubstitutions";
              params: SubstitutionsPredictionPartialOutput;
            }
          | {
              type: "assignSuggestions";
              params: {
                suggestions:
                  | SuggestionPredictionPartialOutput["suggestions"]
                  | null;
              };
            }
          | {
              type: "assignIngredients";
              params: { ingredients: string[] | undefined };
            }
          | {
              type: "assignSubmittedInputHash";
              params: Pick<Context, "tags" | "ingredients" | "prompt">;
            }
          | {
              type: "assignPrompt";
              params: { prompt: string | undefined };
            }
          | {
              type: "assignSlug";
              params: { slug: string | null };
            }
          | {
              type: "appendQueryParam";
              params: { key: string; item: string };
            }
          | { type: "closeMobileKeyboard" }
          | { type: "clearSuggestions" }
          | { type: "clearPrompt" }
          | { type: "clearIngredients" }
          | { type: "clearTags" }
          | { type: "clearParams" }
          | { type: "resetScroll" }
          | { type: "navigate"; params: { pathname: string } }
          | { type: "generateSubstitutions" }
          | {
              type: "updateQueryParameter";
              params: { key: string; value: string | null };
            },
      },
      on: {
        PAGE_LOADED: {
          guard: {
            type: "didNavigateToRecipe",
            params: ({ event: { pathname } }) => ({
              pathname,
            }),
          },
          actions: {
            type: "assignSlug",
            params: ({ event: { pathname } }) => ({
              slug: RecipePathSchema.parse(pathname),
            }),
          },
        },
        REMOVE_TAG: {
          actions: [
            {
              type: "assignTags",
              params: ({ context, event }) => ({
                tags: context.ingredients
                  ? context.ingredients.filter((item) => item !== event.tag)
                  : undefined,
              }),
            },
            {
              type: "updateQueryParameter",
              params({ context }) {
                return {
                  key: "tags",
                  value: context.tags
                    ? tagsParser.serialize(context.tags)
                    : null,
                };
              },
            },
          ],
        },
        REMOVE_INGREDIENT: {
          actions: [
            {
              type: "assignIngredients",
              params: ({ context, event }) => ({
                ingredients: context.ingredients
                  ? context.ingredients.filter(
                      (item) => item !== event.ingredient
                    )
                  : undefined,
              }),
            },
            {
              type: "updateQueryParameter",
              params({ context }) {
                return {
                  key: "ingredients",
                  value: context.ingredients
                    ? tagsParser.serialize(context.ingredients)
                    : null,
                };
              },
            },
          ],
        },
        ADD_TAG: {
          actions: [
            {
              type: "assignTags",
              params: ({ context, event }) => ({
                tags: context.tags ? [...context.tags, event.tag] : [event.tag],
              }),
            },
            {
              type: "updateQueryParameter",
              params: ({ context }) => ({
                key: "tags",
                value: context.tags ? tagsParser.serialize(context.tags) : null,
              }),
            },
            {
              type: "assignPrompt",
              params: () => ({
                prompt: undefined,
              }),
            },
            {
              type: "updateQueryParameter",
              params: () => ({
                key: "prompt",
                value: null,
              }),
            },
          ],
        },
        ADD_INGREDIENT: {
          actions: [
            {
              type: "assignIngredients",
              params: ({ context, event }) => ({
                ingredients: context.ingredients
                  ? [...context.ingredients, event.ingredient]
                  : [event.ingredient],
              }),
            },
            {
              type: "updateQueryParameter",
              params: ({ context }) => ({
                key: "ingredients",
                value: context.ingredients
                  ? tagsParser.serialize(context.ingredients)
                  : null,
              }),
            },
            {
              type: "assignPrompt",
              params: () => ({
                prompt: undefined,
              }),
            },
            {
              type: "updateQueryParameter",
              params: () => ({
                key: "prompt",
                value: null,
              }),
            },
          ],
        },
        NEW_RECIPE: { target: [".Mode.New", ".OpenState.Open"] },
        MODIFY: { target: [".Mode.Modify", ".OpenState.Open"] },
        MODIFY_RECIPE_DIETARY: {
          target: [".Mode.Modify.Dietary", ".OpenState.Open"],
        },
        MODIFY_RECIPE_EQUIPMENT: {
          target: [".Mode.Modify.Equipment", ".OpenState.Open"],
        },
        MODIFY_RECIPE_INGREDIENTS: {
          target: [".Mode.Modify.Substitute", ".OpenState.Open"],
        },
        MODIFY_RECIPE_SCALE: {
          target: [".Mode.Modify.Scale", ".OpenState.Open"],
        },
      },
      type: "parallel",
      states: {
        FocusState: {
          initial: "NotFocused",
          on: {
            FOCUS_PROMPT: ".Focused",
            BLUR_PROMPT: ".NotFocused",
            SET_INPUT: {
              actions: [
                {
                  type: "assignPrompt",
                  params: ({ event }) => ({
                    prompt: event.value,
                  }),
                },
                {
                  type: "updateQueryParameter",
                  params({ context }) {
                    return {
                      key: "prompt",
                      value: context.prompt?.length ? context.prompt : null,
                    };
                  },
                },
              ],
            },
          },
          states: {
            NotFocused: {},
            Focused: {},
          },
        },
        OpenState: {
          initial: initialOpenState,
          states: {
            Open: {
              entry: [
                {
                  type: "updateQueryParameter",
                  params: ({ context, event }) => ({
                    key: "crafting",
                    value: "1",
                  }),
                },
              ],
              exit: [
                "clearSuggestions",
                "clearIngredients",
                "clearParams",
                "clearPrompt",
                "clearParams",
              ],
              on: {
                CLOSE: "Closed",
                TOGGLE: "Closed",
              },
            },
            Closed: {
              id: "Closed",
              entry: [
                {
                  type: "updateQueryParameter",
                  params: ({ context, event }) => ({
                    key: "crafting",
                    value: null,
                  }),
                },
              ],
              on: {
                TOGGLE: "Open",
              },
            },
          },
        },
        Mode: {
          initial: initialMode,
          on: {
            CLOSE: ".New",
            TOGGLE: ".New",
          },
          states: {
            New: {
              on: {
                SELECT_RESULT: {
                  target: [".Navigating"],
                  actions: [
                    {
                      type: "navigate",
                      params: ({ context, event }) => {
                        assert(
                          context.resultId,
                          "expected resultId when attempting to navigate to result"
                        );
                        return {
                          pathname: `/result/${context.resultId}/${event.index}`,
                        };
                      },
                    },
                  ],
                },
              },
              initial: "Inputting",
              // after: {
              //   500: {
              //     actions: assign({
              //       instantRecipeMetadata: undefined,
              //       instantRecipeMetadataGeneratorId: ({ spawn, context }) => {
              //         if (context.instantRecipeMetadataGeneratorId) {
              //           stop(context.instantRecipeMetadataGeneratorId);
              //         }

              //         if (context.prompt?.length) {
              //           const id = nanoid();
              //           spawn("instantRecipeMetadataGenerator", {
              //             id,
              //             input: {
              //               prompt: context.prompt!,
              //             },
              //           });
              //           return id;
              //         } else {
              //           return undefined;
              //         }
              //       },
              //     }),
              //   },
              // },
              states: {
                Inputting: {
                  type: "parallel",
                  states: {
                    InstantRecipe: {
                      initial: !!prompt?.length ? "Holding" : "Idle",
                      states: {
                        Idle: {
                          on: {
                            SET_INPUT: {
                              target: "Holding",
                              guard: ({ context }) => !!context.prompt?.length,
                            },
                          },
                        },
                        Holding: {
                          entry: assign({
                            instantRecipeMetadata: undefined,
                          }),
                          on: {
                            SET_INPUT: [
                              {
                                target: "Holding",
                                guard: ({ context }) =>
                                  !!context.prompt?.length,
                              },
                              { target: "Idle" },
                            ],
                          },
                          after: {
                            1000: {
                              target: "InProgress",
                              guard: ({ context }) => !!context.prompt?.length,
                            },
                          },
                        },
                        InProgress: {
                          invoke: {
                            src: "instantRecipeMetadataGenerator",
                            input: ({ context }) => {
                              assert(context.prompt, "expected prompt");
                              return { prompt: context.prompt };
                            },
                            onDone: "Idle",
                          },
                          on: {
                            SET_INPUT: {
                              target: "Holding",
                              actions: assign({
                                instantRecipeMetadata: undefined,
                              }),
                            },
                            INSTANT_RECIPE_METADATA_PROGRESS: {
                              actions: assign({
                                instantRecipeMetadata: ({ event }) =>
                                  event.data,
                              }),
                            },
                            INSTANT_RECIPE_METADATA_COMPLETE: {
                              actions: assign({
                                instantRecipeMetadata: ({ event }) =>
                                  event.data,
                              }),
                            },
                          },
                        },
                      },
                    },
                  },
                  on: {
                    SUGGEST_RECIPES: {
                      target: "Suggestions",
                      actions: {
                        type: "assignSubmittedInputHash",
                        params: ({ context }) => ({ ...context }),
                      },
                    },
                    SET_INPUT: {
                      target: ["Inputting"],
                      // actions: assign({
                      //   instantRecipeMetadata: undefined,
                      //   instantRecipeMetadataGeneratorId: ({
                      //     spawn,
                      //     context,
                      //   }) => {
                      //     if (context.instantRecipeMetadataGeneratorId) {
                      //       stop(context.instantRecipeMetadataGeneratorId);
                      //     }

                      //     if (context.prompt?.length) {
                      //       const id = nanoid();
                      //       spawn("instantRecipeMetadataGenerator", {
                      //         id,
                      //         input: {
                      //           prompt: context.prompt!,
                      //         },
                      //       });
                      //       return id;
                      //     } else {
                      //       return undefined;
                      //     }
                      //   },
                      // }),
                    },
                    INSTANT_RECIPE: {
                      target: ["Navigating"],
                      actions: [
                        {
                          type: "navigate",
                          params: (f) => {
                            assert(
                              f.context.prompt?.length,
                              "expected prompt to be not empty"
                            );
                            const params = new URLSearchParams();
                            params.set("prompt", f.context.prompt);
                            const name = f.context.instantRecipeMetadata?.name;
                            const description =
                              f.context.instantRecipeMetadata?.description;
                            if (name && description) {
                              params.set("name", name);
                              params.set("description", description);
                            }

                            const paramString = params.toString();

                            return {
                              pathname: `/instant-recipe?${paramString}`,
                            };
                          },
                        },
                      ],
                    },
                  },
                },
                Suggestions: {
                  initial: "Loading",
                  onDone: "Inputting",
                  entry: [
                    "closeMobileKeyboard",
                    {
                      type: "assignSuggestions",
                      params: {
                        suggestions: undefined,
                      },
                    },
                  ],
                  states: {
                    Loading: {
                      after: {
                        50: {
                          actions: "resetScroll",
                        },
                      },
                      on: {
                        SUGGESTION_START: {
                          actions: {
                            type: "assignResultId",
                            params: ({ event }) => ({
                              resultId: event.resultId,
                            }),
                          },
                        },
                        SUGGESTION_PROGRESS: {
                          actions: {
                            type: "assignSuggestions",
                            params: ({ event }) => ({
                              suggestions: event.data.suggestions,
                            }),
                          },
                        },
                        SUGGESTION_COMPLETE: {
                          actions: {
                            type: "assignSuggestions",
                            params: ({ event }) => ({
                              suggestions: event.data.suggestions,
                            }),
                          },
                        },
                      },
                      invoke: {
                        src: "suggestionsGenerator",
                        input: ({ context }) => {
                          return SuggestionsInputSchema.parse(context);
                        },
                        onDone: "Complete",
                      },
                    },
                    Complete: {
                      type: "final",
                    },
                  },
                },
                Navigating: {
                  always: {
                    target: ["#Closed"],
                  },
                },
                Complete: {
                  type: "final",
                },
              },
            },
            Modify: {
              initial: "None",
              states: {
                None: {},
                Substitute: {
                  initial: "Initializing",
                  on: {
                    SELECT_RESULT: {
                      target: [".Navigating", "#Closed"],
                      actions: [
                        {
                          type: "navigate",
                          params: ({ context, event }) => {
                            const prompt = context.substitutions?.[event.index];
                            assert(prompt, "expected prompt");
                            assert(context.slug, "expected slug");
                            return {
                              pathname: `/recipe/${
                                context.slug
                              }/remix?prompt=${encodeURIComponent(
                                prompt
                              )}&modification=substitute`,
                            };
                          },
                        },
                      ],
                    },
                  },
                  states: {
                    Initializing: {
                      always: [
                        {
                          target: "Idle",
                          guard: { type: "didCompleteSubstitutions" },
                        },
                        {
                          target: "Loading",
                        },
                      ],
                    },
                    Loading: {
                      on: {
                        SUBSTITUTIONS_PROGRESS: {
                          actions: [
                            {
                              type: "assignSubstitutions",
                              params: ({ event }) => ({
                                substitutions: event.data.substitutions,
                              }),
                            },
                          ],
                        },
                        SUBSTITUTIONS_COMPLETE: {
                          actions: {
                            type: "assignSubstitutions",
                            params: ({ event }) => ({
                              substitutions: event.data.substitutions,
                            }),
                          },
                        },
                      },
                      invoke: {
                        src: "substitutionsGenerator",
                        input: ({ context }) => {
                          const { slug, ...rest } = context;
                          assert(
                            slug,
                            "expected slug when trying to run suggestionsGenerator"
                          );
                          return { slug, ...rest };
                        },
                        onDone: "Idle",
                      },
                    },
                    Idle: {},
                    Navigating: {},
                  },
                },
                Dietary: {
                  initial: "Initializing",
                  on: {
                    SELECT_RESULT: {
                      target: [".Navigating", "#Closed"],
                      actions: [
                        {
                          type: "navigate",
                          params: ({ context, event }) => {
                            const prompt =
                              context.dietaryAlternatives?.[event.index];
                            assert(prompt, "expected prompt");
                            assert(context.slug, "expected slug");
                            return {
                              pathname: `/recipe/${context.slug}/remix?prompt=${prompt}&modification=dietary`,
                            };
                          },
                        },
                      ],
                    },
                  },
                  states: {
                    Initializing: {
                      always: [
                        {
                          target: "Idle",
                          guard: { type: "didCompleteDietaryAlternatives" },
                        },
                        {
                          target: "Loading",
                        },
                      ],
                    },
                    Loading: {
                      on: {
                        DIETARY_ALTERNATIVES_PROGRESS: {
                          actions: [
                            {
                              type: "assignDietaryAlternatives",
                              params: ({ event: { data } }) => ({
                                dietaryAlternatives: data.ideas,
                              }),
                            },
                          ],
                        },
                        DIETARY_ALTERNATIVES_COMPLETE: {
                          actions: {
                            type: "assignDietaryAlternatives",
                            params: ({ event }) => ({
                              dietaryAlternatives: event.data.ideas,
                            }),
                          },
                        },
                      },
                      invoke: {
                        src: "dietaryAlternativesGenerator",
                        input: ({ context }) => {
                          const { slug, ...rest } = context;
                          assert(
                            slug,
                            "expected slug when trying to run dietaryAlternativesGenerator"
                          );
                          return { slug, ...rest };
                        },
                        onDone: "Idle",
                      },
                    },
                    Idle: {},
                    Navigating: {},
                  },
                },
                Equipment: {
                  initial: "Initializing",
                  on: {
                    SELECT_RESULT: {
                      target: [".Navigating", "#Closed"],
                      actions: [
                        {
                          type: "navigate",
                          params: ({ context, event }) => {
                            const prompt =
                              context.equipmentAdaptations?.[event.index];
                            assert(prompt, "expected prompt");
                            assert(context.slug, "expected slug");
                            return {
                              pathname: `/recipe/${context.slug}/remix?prompt=${prompt}&modification=equipment"`,
                            };
                          },
                        },
                      ],
                    },
                  },
                  states: {
                    Initializing: {
                      always: [
                        {
                          target: "Idle",
                          guard: { type: "didCompleteEquipmentAdaptations" },
                        },
                        {
                          target: "Loading",
                        },
                      ],
                    },
                    Loading: {
                      on: {
                        EQUIPMENT_ADAPTATIONS_PROGRESS: {
                          actions: [
                            {
                              type: "assignEquipmentAdaptations",
                              params: ({ event }) => ({
                                equipmentAdaptations: event.data.ideas,
                              }),
                            },
                          ],
                        },
                        EQUIPMENT_ADAPTATIONS_COMPLETE: {
                          actions: {
                            type: "assignEquipmentAdaptations",
                            params: ({ event }) => ({
                              equipmentAdaptations: event.data.ideas,
                            }),
                          },
                        },
                      },
                      invoke: {
                        src: "equipmentAdaptationsGenerator",
                        input: ({ context }) => {
                          const { slug, ...rest } = context;
                          assert(
                            slug,
                            "expected slug when trying to run equipmentAdaptationsGenerator"
                          );
                          return { slug, ...rest };
                        },
                        onDone: "Idle",
                      },
                    },
                    Idle: {},
                    Navigating: {},
                  },
                },
                Scale: {
                  initial: "Initializing",
                  on: {
                    SELECT_RESULT: {
                      target: [".Navigating", "#Closed"],
                      actions: [
                        {
                          type: "navigate",
                          params: ({ context, event }) => {
                            const prompt = context.substitutions?.[event.index];
                            assert(prompt, "expected prompt");
                            assert(context.slug, "expected slug");
                            return {
                              pathname: `/recipe/${context.slug}/remix?prompt=${prompt}&modification=scale"`,
                            };
                          },
                        },
                      ],
                    },
                  },
                  states: {
                    Initializing: {
                      always: [
                        {
                          target: "Idle",
                          guard: { type: "didCompleteSubstitutions" },
                        },
                        {
                          target: "Loading",
                        },
                      ],
                    },
                    Loading: {
                      on: {
                        SUBSTITUTIONS_PROGRESS: {
                          actions: [
                            {
                              type: "assignSubstitutions",
                              params: ({ event }) => ({
                                substitutions: event.data.substitutions,
                              }),
                            },
                          ],
                        },
                        SUBSTITUTIONS_COMPLETE: {
                          actions: {
                            type: "assignSubstitutions",
                            params: ({ event }) => ({
                              substitutions: event.data.substitutions,
                            }),
                          },
                        },
                      },
                      invoke: {
                        src: "substitutionsGenerator",
                        input: ({ context }) => {
                          const { slug, ...rest } = context;
                          assert(
                            slug,
                            "expected slug when trying to run suggestionsGenerator"
                          );
                          return { slug, ...rest };
                        },
                        onDone: "Idle",
                      },
                    },
                    Idle: {},
                    Navigating: {},
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      actions: {
        assignIngredients: assign({
          ingredients: (_, params) => params.ingredients,
        }),
        assignSubmittedInputHash: assign({
          submittedInputHash: (_, params) =>
            getObjectHash({
              prompt: params.prompt,
              ingredients: params.ingredients,
              tags: params.tags,
            }),
        }),
        assignResultId: assign({
          resultId: (_, params) => params.resultId,
        }),
        assignTags: assign({
          tags: (_, params) => params.tags,
        }),
        assignSuggestions: assign({
          suggestions: (_, params) => params.suggestions,
        }),
        assignSubstitutions: assign({
          substitutions: (_, params) => params.substitutions,
        }),
        assignEquipmentAdaptations: assign({
          equipmentAdaptations: (_, params) => params.equipmentAdaptations,
        }),
        assignDietaryAlternatives: assign({
          dietaryAlternatives: (_, params) => params.dietaryAlternatives,
        }),
        assignPrompt: assign({
          prompt: (_, params) => params.prompt,
        }),
        assignSlug: assign({
          substitutions: undefined,
          slug: (_, params) => {
            return params.slug;
          },
        }),

        updateQueryParameter: (_, params) => {
          const { key, value } = params;

          // If no window object, it may be a non-browser environment like Node.js
          if (typeof window === "undefined") {
            throw new Error(
              "This function can only be used in a browser environment."
            );
          }

          // Construct URLSearchParams object from the current query string
          const queryParams = new URLSearchParams(window.location.search);

          // Check if the value is an array or a single string
          if (!!value) {
            queryParams.set(key, value);
            // } else if (Array.isArray(value)) {
            //   queryParams.set(key, value.join(","));
          } else {
            queryParams.delete(key);
          }

          const paramString = queryParams.toString();

          // Construct the new URL
          const newUrl =
            paramString !== ""
              ? window.location.pathname + "?" + paramString
              : window.location.pathname;

          // Use the history API to update the URL without reloading the page
          window.history.replaceState({}, "", newUrl);
        },

        clearPrompt: assign({
          prompt: () => undefined,
        }),
        clearIngredients: assign({
          ingredients: () => undefined,
        }),
        clearTags: assign({
          tags: () => undefined,
        }),
        clearSuggestions: assign({
          suggestions: () => null,
        }),
        navigate: (_, params) => {
          router.push(params.pathname);
        },
        closeMobileKeyboard: ({ context }) => {
          // Close keyboard on mobile
          if (isMobile()) {
            (document.activeElement as HTMLElement)?.blur();
          }
        },
        resetScroll: ({ context }) => {
          if (context.scrollViewRef.current) {
            context.scrollViewRef.current.scrollTop = 0;
          }
        },
        clearParams: () => {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, "", newUrl);
        },
      },
      actors: {
        substitutionsGenerator,
        suggestionsGenerator,
        instantRecipeMetadataGenerator,
        dietaryAlternativesGenerator,
        equipmentAdaptationsGenerator,
      },
      guards: {
        didNavigateToRecipe: ({ context }, params) => {
          const parse = RecipePathSchema.safeParse(params.pathname);
          return parse.success && parse.data !== context.slug;
        },
        didCompleteSubstitutions: ({ context }) =>
          context.substitutions?.length === 6,
        didCompleteDietaryAlternatives: ({ context }) =>
          context.dietaryAlternatives?.length === 6,
        didCompleteEquipmentAdaptations: ({ context }) =>
          context.equipmentAdaptations?.length === 4,
      },
    }
  );
};
