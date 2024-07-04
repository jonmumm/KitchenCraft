import { streamToObservable } from "@/lib/stream-to-observable";
import { produce } from "immer";

import { captureEvent } from "@/actions/capturePostHogEvent";
import { fetchLists } from "@/actors/fetchLists";
import { initializeUserSocket } from "@/actors/initializeUserSocket";
import { ListenSessionEvent, listenSession } from "@/actors/listenSession";
import { ListenUserEvent, listenUser } from "@/actors/listenUser";
import { saveRecipeToListBySlug } from "@/actors/saveRecipeToListBySlug";
import { LIST_SLUG_INPUT_KEY } from "@/constants/inputs";
import { defaultLists } from "@/constants/lists";
import { CHOOSING_LISTS_FOR_RECIPE_ID_PARAM } from "@/constants/query-params";
import {
  ListTable,
  ProfileTable,
  RecipesTable,
  UserPreferencesTable,
  UsersTable,
} from "@/db";
import { NewRecipe } from "@/db/types";
import { didChangeEmailInput } from "@/guards/didChangeEmailInput";
import { didChangeListSlugInput } from "@/guards/didChangeListSlugInput";
import { parseTokenForId } from "@/lib/actor-kit/tokens";
import { DatabaseErrorSchema, handleDatabaseError } from "@/lib/db";
import { getErrorMessage } from "@/lib/error";
import { withDatabaseSpan } from "@/lib/observability";
import { getSlug } from "@/lib/slug";
import {
  assert,
  assertType,
  sentenceToSlug,
  slugToSentence,
} from "@/lib/utils";
import { createNewListWithRecipeIds } from "@/queries/createNewListWithRecipeIds";
import { getNewSharedListName } from "@/queries/getAvailableSharedListName";
import { SlugSchema } from "@/schema";
import {
  AdInstance,
  AppEvent,
  Caller,
  PartialRecipe,
  PartyMap,
  ProductType,
  ResumeEvent,
  ServerPartySocket,
  SystemEvent,
  UserPreferenceType,
  UserPreferences,
  WithCaller,
} from "@/types";
import { createClient } from "@vercel/postgres";
import { randomUUID } from "crypto";
import { and, eq, ilike, inArray, max, sql as sqlFN } from "drizzle-orm";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { Operation, compare } from "fast-json-patch";
import * as Party from "partykit/server";
import { from, switchMap } from "rxjs";
import {
  SnapshotFrom,
  StateValueFrom,
  assertEvent,
  assign,
  enqueueActions,
  fromEventObservable,
  fromPromise,
  and as guardAnd,
  setup,
  spawnChild,
  stateIn,
} from "xstate";
import { z } from "zod";
import { initializeSessionSocket } from "../actors/initializeSessionSocket";
import {
  generateChefNameSuggestions,
  generateListNameSuggestions,
  getUserPreferences,
} from "../actors/shared";
import { AutoSuggestIngredientEvent } from "./auto-suggest-ingredients.stream";
import {
  AutoSuggestPlaceholderEvent,
  AutoSuggestPlaceholderOutputSchema,
  AutoSuggestPlaceholderStream,
} from "./auto-suggest-placeholder.stream";
import { AutoSuggestRecipesEvent } from "./auto-suggest-recipes.stream";
import { AutoSuggestTagEvent } from "./auto-suggest-tags.stream";
import { AutoSuggestTextEvent } from "./auto-suggest-text.stream";
import {
  AutoSuggestTokensEvent,
  AutoSuggestTokensStream,
} from "./auto-suggest-tokens.stream";
import {
  FullRecipeFromSuggestionEvent,
  FullRecipeFromSuggestionStream,
} from "./full-recipe-from-suggestion.stream";
import { FullRecipeEvent, FullRecipeStream } from "./full-recipe.stream";
import {
  InstantRecipeEvent,
  InstantRecipeStream,
} from "./instant-recipe.stream";
import { MoreRecipeIdeasMetadataStream } from "./more-recipe-ideas-metadata.stream";
import {
  RecipeIdeasMetadataEvent,
  RecipeIdeasMetadataStream,
} from "./recipe-ideas-metadata.stream";
import { SuggestRecipeProductsEvent } from "./recipe/[slug]/products/recipe-products-stream";
import { SessionSnapshot } from "./session-store.types";
import { SuggestChefNamesEvent } from "./suggest-chef-names-stream";
import { SuggestListNamesEvent } from "./suggest-list-names-stream";
import { UserSnapshot } from "./user-machine";
import { buildInput } from "./utils";
import { SuggestChefNamesEvent } from "./suggest-chef-names-stream";
import { SuggestListNamesEvent } from "./suggest-list-names-stream";
import { UserSnapshot } from "./user-machine";
import { buildInput } from "./utils";
import { defaultLists } from "@/constants/lists";

export const SESSION_ACTOR_ID = "sessionActor";
export const USER_ACTOR_ID = "userActor";

const NUM_RECIPES_PER_BATCH = 5;

type NewRecipeProductKeywordEvent = {
  type: "NEW_RECIPE_PRODUCT_KEYWORD";
  keyword: string;
  productType: ProductType;
  slug: string;
};

const InputSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  initialCaller: z.custom<Caller>(),
  sessionAccessToken: z.string(),
  userAccessToken: z.string(),
});
type Input = z.infer<typeof InputSchema>;

type Recipe = PartialRecipe & {
  matchPercent: number | undefined;
  complete: boolean;
  metadataComplete: boolean;
  started: boolean;
  fullStarted: boolean;
};

type List = {
  id: string;
  name: string;
  icon: string;
  slug: string;
  created: boolean;
  public: boolean;
  count: number;
  createdAt: Date;
};

export type PageSessionContext = {
  userId?: string;
  sessionId?: string;
  choosingListsForRecipeId?: string;
  onboardingInput: {
    mealType?: string | undefined;
  };
  currentListSlug: string | undefined;
  currentListId: string | undefined;
  recipeIdToSave: string | undefined;
  pageSessionId: string;
  uniqueId: string;
  isNewUser: boolean | undefined;
  initialCaller: Caller;
  createdBy?: string;
  prompt: string;
  chefname: string | undefined;
  email: string | undefined;
  previousSuggestedChefnames: string[];
  suggestedChefnames: string[];
  previouslySuggestedListNames: string[];
  suggestedListNames: string[];
  tokens: string[];
  results: Record<
    string,
    {
      suggestedRecipes: string[];
      suggestedTokens: string[];
    }
  >;
  recipes: Record<string, Recipe>;
  listRecipes: Record<string, Record<string, true>>;
  generatingRecipeId: string | undefined;
  currentItemIndex: number;
  currentListRecipeIndex: number;
  sessionAccessToken: string;
  userAccessToken: string;
  placeholders: string[];
  listSlug: string | undefined;
  adInstances: Record<string, AdInstance>;
  viewedAdInstanceIds: string[];
  clickedAdInstanceIds: string[];
  productIdViewCounts: Record<string, number>;
  undoOperations: Operation[][];
  redoOperations: Operation[][];
  history: string[];
  userPreferences: UserPreferences; // New field to store user preferences
  modifiedPreferences: Partial<Record<keyof UserPreferences, true>>;
  sessionSnapshot: SessionSnapshot | undefined;
  userSnapshot: UserSnapshot | undefined;
  sharingListId?: string;
  shareNameInput?: string;
  listsById: Record<string, List>;
  resultIdsByPrompt: Record<string, string>;
};

export type PageSessionEvent =
  | WithCaller<AppEvent>
  | WithCaller<SystemEvent>
  | AutoSuggestTagEvent
  | AutoSuggestIngredientEvent
  | AutoSuggestRecipesEvent
  | AutoSuggestTextEvent
  | AutoSuggestTokensEvent
  | AutoSuggestPlaceholderEvent
  | InstantRecipeEvent
  | RecipeIdeasMetadataEvent
  | SuggestRecipeProductsEvent
  | SuggestChefNamesEvent
  | SuggestListNamesEvent
  | FullRecipeEvent
  | FullRecipeFromSuggestionEvent
  | NewRecipeProductKeywordEvent
  | ListenUserEvent
  | ListenSessionEvent
  | ResumeEvent;

export const createPageSessionMachine = ({
  id,
  storage,
  parties,
}: {
  id: string;
  storage: Party.Storage;
  parties: PartyMap;
}) => {
  let sessionSocket: ServerPartySocket | undefined;
  let userSocket: ServerPartySocket | undefined;

  const pageSessionMachine = setup({
    types: {
      input: {} as Input,
      context: {} as PageSessionContext,
      events: {} as PageSessionEvent,
    },
    actors: {
      saveRecipeToListBySlug,
      parseTokens: fromPromise(
        async ({
          input,
        }: {
          input: { userAccessToken: string; sessionAccessToken: string };
        }) => {
          const userId = (await parseTokenForId(input.userAccessToken)).payload
            .jti;
          const sessionId = (await parseTokenForId(input.sessionAccessToken))
            .payload.jti;
          assert(userId, "expected userId from userAccessToken");
          assert(sessionId, "expected sessionId from sessionAccessToken");

          return {
            userId,
            sessionId,
          };
        }
      ),
      fetchLists,
      generateChefNameSuggestions,
      generateListNameSuggestions,
      getUserPreferences,
      initializeSessionSocket,
      initializeUserSocket,
      listenSession,
      listenUser,
      getNewSharedListName: fromPromise(
        async ({ input }: { input: { userId: string; timezone: string } }) => {
          const client = createClient();
          try {
            await client.connect();
            const db = drizzle(client);
            return await getNewSharedListName(db, input.userId, input.timezone);
          } catch (ex) {
            handleDatabaseError(ex);
          } finally {
            await client.end();
          }
        }
      ),
      createSharedList: fromPromise(async () => {
        return {
          id,
        };
      }),
      updateChefName: fromPromise(
        async ({
          input,
        }: {
          input: {
            chefname: string;
            userId: string;
          };
        }) => {
          const client = createClient();
          try {
            await client.connect();
            const db = drizzle(client);
            return await db
              .update(ProfileTable)
              .set({ profileSlug: input.chefname })
              .where(eq(ProfileTable.userId, input.userId));
          } finally {
            await client.end();
          }
        }
      ),
      getRecipes: fromPromise(
        async ({ input }: { input: { recipeIds: string[] } }) => {
          const client = createClient();
          try {
            await client.connect();
            const db = drizzle(client);
            const maxVersionSubquery = db
              .select({
                recipeId: RecipesTable.id,
                maxVersionId: max(RecipesTable.versionId).as("maxVersionId"),
              })
              .from(RecipesTable)
              .groupBy(RecipesTable.id)
              .as("maxVersionSubquery"); // Naming the subquery

            const recipes = await db
              .select()
              .from(RecipesTable)
              .innerJoin(
                maxVersionSubquery,
                and(
                  eq(RecipesTable.id, maxVersionSubquery.recipeId),
                  eq(RecipesTable.versionId, maxVersionSubquery.maxVersionId)
                )
              )
              .where(inArray(RecipesTable.id, input.recipeIds));

            return recipes;
          } finally {
            await client.end();
          }
        }
      ),
      getChefName: fromPromise(
        async ({
          input,
        }: {
          input: {
            userId: string;
          };
        }) => {
          return await getChefNameByUserId(input.userId);
        }
      ),
      checkShareNameAvailability: fromPromise(
        async ({
          input,
        }: {
          input: {
            userId: string;
            shareName: string;
          };
        }) => {
          const client = createClient();
          // todo also check against the resreved namesd
          try {
            await client.connect();
            const db = drizzle(client);
            return !(
              await db
                .select()
                .from(ListTable)
                .where(
                  and(
                    eq(ListTable.createdBy, input.userId),
                    eq(ListTable.slug, sentenceToSlug(input.shareName))
                  )
                )
            )[0];
          } finally {
            await client.end();
          }
        }
      ),
      checkChefNameAvailability: fromPromise(
        async ({
          input,
        }: {
          input: {
            chefname: string;
          };
        }) => {
          const profile = await getProfileBySlug(input.chefname);
          return !profile;
        }
      ),
      checkIfNewUser: fromPromise(
        async ({
          input,
        }: {
          input: {
            email: string;
          };
        }) => {
          const client = createClient();
          try {
            await client.connect();
            const db = drizzle(client);
            return !(
              await db
                .select()
                .from(UsersTable)
                .where(eq(UsersTable.email, input.email))
            )[0];
          } finally {
            await client.end();
          }
        }
      ),
      createNewList: fromPromise(
        async ({
          input,
        }: {
          input: {
            listSlug: string;
            userId: string;
            recipeIdsToAdd: string[];
          };
        }) => {
          const client = createClient();
          await client.connect();
          const db = drizzle(client);
          try {
            return await db.transaction(async (tx) => {
              return await createNewListWithRecipeIds({
                db: tx,
                ...input,
              });
            });
          } catch (error) {
            const parsedError = DatabaseErrorSchema.safeParse(error);
            if (parsedError.success) {
              throw parsedError.data;
            } else {
              throw error;
            }
          } finally {
            await client.end();
          }
        }
      ),
      createNewRecipe: fromPromise(
        async ({
          input,
        }: {
          input: {
            recipe: PartialRecipe;
            prompt: string;
            tokens: string[];
            createdBy: string;
          };
        }) => {
          const { recipe } = input;

          assert(recipe.name, "expected name");
          assert(recipe.description, "expected description");
          assert(recipe.slug, "expected slug");

          const finalRecipe = {
            id: recipe.id,
            slug: recipe.slug,
            versionId: recipe.versionId,
            description: recipe.description,
            name: recipe.name,
            yield: recipe.yield!,
            tags: recipe.tags!,
            ingredients: recipe.ingredients!,
            instructions: recipe.instructions!,
            cookTime: recipe.cookTime!,
            tokens: input.tokens,
            activeTime: recipe.activeTime!,
            totalTime: recipe.totalTime!,
            prompt: input.prompt,
            createdBy: input.createdBy,
            createdAt: new Date(),
          } satisfies NewRecipe;

          const client = createClient();
          await client.connect();
          const db = drizzle(client);
          try {
            await db.insert(RecipesTable).values(finalRecipe);
            return recipe.slug;
          } finally {
            await client.end();
          }
        }
      ),
      generatePlaceholders: fromEventObservable(
        ({ input }: { input: { prompt: string } }) => {
          const tokenStream = new AutoSuggestPlaceholderStream();
          return from(tokenStream.getStream(input)).pipe(
            switchMap((stream) => {
              return streamToObservable(
                stream,
                "PLACEHOLDER",
                AutoSuggestPlaceholderOutputSchema
              );
            })
          );
        }
      ),
      generateMoreRecipeIdeasMetadata: fromEventObservable(
        ({
          input,
        }: {
          input: {
            prompt: string;
            previousRecipes: {
              name: string;
              description: string;
              matchPercent: number;
            }[];
          };
        }) => new MoreRecipeIdeasMetadataStream().getObservable(input)
      ),
      generateRecipeIdeasMetadata: fromEventObservable(
        ({
          input,
        }: {
          input: {
            prompt: string;
            tokens: string[];
            instantRecipe: {
              name: string;
              description: string;
              ingredients: string[];
            };
          };
        }) => new RecipeIdeasMetadataStream().getObservable(input)
      ),
      generateInstantRecipe: fromEventObservable(
        ({
          input,
        }: {
          input: {
            prompt: string;
            recipeId: string;
          };
        }) => new InstantRecipeStream(input.recipeId).getObservable(input)
      ),
      generateFullRecipeFromSuggestion: fromEventObservable(
        ({
          input,
        }: {
          input: {
            category: string;
            name: string;
            tagline: string;
            id: string;
          };
        }) => new FullRecipeFromSuggestionStream(input.id).getObservable(input)
      ),
      generateFullRecipe: fromEventObservable(
        ({
          input,
        }: {
          input: {
            prompt: string;
            tokens: string[];
            name: string;
            description: string;
            id: string;
          };
        }) => new FullRecipeStream(input.id).getObservable(input)
      ),
      generateTokens: fromEventObservable(
        ({ input }: { input: { prompt: string } }) =>
          new AutoSuggestTokensStream().getObservable(input)
      ),
      updateUserPreferences: fromPromise(
        async ({
          input,
        }: {
          input: {
            userId: string;
            preferences: { type: UserPreferenceType; value: string }[];
          };
        }) => {
          await upsertUserPreferences(input.userId, input.preferences);
        }
      ),
    },
    guards: {
      hasUserId: ({ context }) => !!context.userId,
      hasUserSnapshot: ({ context }) => !!context.userSnapshot,
      hasSessionSnapshot: ({ context }) => !!context.sessionSnapshot,
      didViewCardNearEnd: ({ context, event }) => {
        assertEvent(event, "VIEW_RESULT");

        const resultId = context.resultIdsByPrompt[context.prompt];
        if (!resultId) {
          return false;
        }
        const results = context.results[resultId];
        const numRecipeIds = results?.suggestedRecipes.length || 0;

        return event.index > numRecipeIds - 2;
      },
      nextNextRecipeInCategoryShouldBeCreated: ({ context, event }) => {
        assertType(event, "VIEW_RECIPE");
        const feedItems = context.sessionSnapshot?.context.feedItemsById;
        if (!feedItems) return false;

        const feedItem = Object.values(feedItems).find(
          (item) => item.recipes?.find((recipe) => recipe?.id === event.id)
        );
        if (!feedItem) return false;

        const recipes = feedItem?.recipes;
        if (!recipes) return false;

        // Find the index of the current recipe
        const currentIndex = recipes.findIndex(
          (recipe) => recipe?.id === event.id
        );
        if (currentIndex === -1) return false;

        // Check for the next incomplete recipe
        for (let i = currentIndex + 1; i < recipes.length; i++) {
          const recipeId = recipes[i]?.id;
          if (recipeId && !context.recipes[recipeId]?.fullStarted) {
            return true;
          }
        }

        // If no next incomplete recipe found, check from the beginning
        for (let i = 0; i < currentIndex; i++) {
          const recipeId = recipes[i]?.id;
          if (recipeId && !context.recipes[recipeId]?.fullStarted) {
            return true;
          }
        }

        return false;
      },
      nextRecipeInCategoryShouldBeCreated: ({ context, event }): boolean => {
        assertType(event, "VIEW_RECIPE");

        const feedItems = context.sessionSnapshot?.context.feedItemsById;
        if (!feedItems) return false;

        const feedItem = Object.values(feedItems).find(
          (item) => item.recipes?.find((recipe) => recipe?.id === event.id)
        );
        if (!feedItem) return false;

        const recipes = feedItem?.recipes;
        if (!recipes) return false;

        // Find the index of the current recipe
        const currentIndex = recipes.findIndex(
          (recipe) => recipe?.id === event.id
        );
        if (currentIndex === -1) return false;

        const recipeIds = recipes
          .map((recipe) => recipe?.id!)
          .filter((recipeId) => !!recipeId);
        const unstartedRecipes = getSortedUnstartedRecipes(
          recipeIds,
          currentIndex,
          context
        );

        return unstartedRecipes.length >= 1;
      },
      isNewUser: () => {
        return false;
      },
      hasValidChefName: ({ context }) => {
        return !!context.chefname && context.chefname?.length > 0;
      },
      didChangeEmailInput,
      didChangeListSlugInput,
      didChangeChefNameInput: ({ context, event }) => {
        return event.type === "CHANGE" && event.name === "chefname";
      },
      isChefNameNotEmpty: ({ context, event }) => {
        return (
          event.type === "CHANGE" &&
          event.name === "chefname" &&
          !!event.value.length
        );
      },
      shouldCreateNewAds: ({ context }) => {
        Object.values(context.adInstances).map((item) => item.product);
        return false;
      },
      didChangeShareNameInput: ({ event }) => {
        return event.type === "CHANGE" && event.name === "shareNameInput";
      },
    },
    actions: {
      resetSuggestions: assign({
        currentItemIndex: 0,
      }),
      // incrementRecipeCountForCurrentList: assign({
      //   // listsBySlug: ({ context }) => {
      //   //   return produce(context.listsBySlug, (draft) => {
      //   //     assert(draft, "expected listsBySlug when saving");
      //   //     assert(
      //   //       context.currentListSlug,
      //   //       "expected currentListSlug when saving"
      //   //     );
      //   //     const list = draft[context.currentListSlug];
      //   //     assert(list, "expected list when saving");
      //   //     list.recipeCount = list.recipeCount + 1;
      //   //   });
      //   // },
      // }),
      // assignRecipeIdToSave: assign({
      //   recipeIdToSave: ({ context }) => {
      //     const recipeId = context.suggestedRecipes[context.currentItemIndex];
      //     assert(recipeId, "expected recipeId");
      //     return recipeId;
      //   },
      // }),
      assighChefName: assign(({ context }) => {
        return context;
      }),
      // assignListSelection: assign({
      //   currentListSlug: ({ event }) => {
      //     assert(event.type === "SELECT_LIST", "expected SELECT_LIST EVENT");
      //     return event.listSlug;
      //   },
      //   // listsBySlug: ({ event, context }) =>
      //   //   produce(context.listsBySlug, (draft) => {
      //   //     assert(event.type === "SELECT_LIST", "expected SELECT_LIST EVENT");

      //   //     const defaultList = defaultLists[event.listSlug];
      //   //     if (!draft) {
      //   //       draft = {};
      //   //     }

      //   //     if (defaultList) {
      //   //       draft[event.listSlug] = {
      //   //         ...defaultList,
      //   //         createdAt: new Date().toISOString() as unknown as Date,
      //   //         recipeCount: 1,
      //   //       };
      //   //     }
      //   //   }),
      // }),
    },
  }).createMachine({
    id: "PageSessionMachine",
    context: ({ input }) => {
      const url = new URL(input.url);
      return {
        onboardingInput: {},
        currentListRecipeIndex: 0,
        pageSessionId: input.id,
        history: [input.url],
        uniqueId: input.initialCaller.id,
        modifiedPreferences: {},
        userPreferences: {},
        recipeIdToSave: undefined,
        prompt: url.searchParams.get("prompt") || "",
        initialCaller: input.initialCaller,
        listSlug: undefined,
        isNewUser: undefined,
        chefname: undefined,
        suggestedChefnames: [],
        previousSuggestedChefnames: [],
        suggestedListNames: [],
        previouslySuggestedListNames: [],
        email: undefined,
        currentItemIndex: 0,
        currentListSlug: undefined,
        currentListId: undefined,
        errorKeys: {},
        tokens: [],
        recipes: {},
        generatingRecipeId: undefined,
        results: {},
        resultIdsByPrompt: {},
        sessionSnapshot: undefined,
        userSnapshot: undefined,
        suggestedTokens: [],
        placeholders: defaultPlaceholders,
        adInstances: {},
        viewedAdInstanceIds: [],
        clickedAdInstanceIds: [],
        productIdViewCounts: {},
        undoOperations: [],
        redoOperations: [],
        sessionAccessToken: input.sessionAccessToken,
        userAccessToken: input.userAccessToken,
        listRecipes: {},
        listsById: initializeListsById(),
        shareNameInput: undefined,
      };
    },
    type: "parallel",
    onError: {
      actions: () => {
        console.log("error");
        console.log("error");
      },
    },
    // onError: {
    //   actions: () => {

    //   },
    // },
    states: {
      Initialization: {
        initial: "Tokens",
        states: {
          Tokens: {
            initial: "Parsing",
            states: {
              Parsing: {
                invoke: {
                  src: "parseTokens",
                  input: ({ context }) => ({
                    userAccessToken: context.userAccessToken,
                    sessionAccessToken: context.sessionAccessToken,
                  }),
                  onDone: {
                    target: "Complete",
                    actions: assign({
                      userId: ({ event }) => event.output.userId,
                      sessionId: ({ event }) => event.output.sessionId,
                    }),
                  },
                },
              },
              Complete: {
                type: "final",
              },
            },
            onDone: "Loading",
          },
          Loading: {
            // entry: spawnChild("parseTokens", {
            //   input: ({ context }) => ({
            //     userAccessToken: context.userAccessToken,
            //     sessionAccessToken: context.sessionAccessToken,
            //   }),
            // }),
            always: {
              target: "Ready",
              guard: guardAnd([
                "hasUserSnapshot",
                "hasSessionSnapshot",
                stateIn({ ListData: "Complete" }),
              ]),
            },
          },
          Ready: {
            type: "final",
          },
        },
      },
      Session: {
        initial: "Uninitialized",
        states: {
          Uninitialized: {
            always: "Initializing",
          },
          Initializing: {
            invoke: {
              src: "initializeSessionSocket",
              input: ({ context }) => {
                return {
                  sessionAccessToken: context.sessionAccessToken,
                  parties: parties,
                  caller: context.initialCaller,
                };
              },
              onDone: {
                target: "Running",
                actions: ({ event }) => {
                  sessionSocket = event.output;
                },
              },
            },
          },
          Running: {
            always: {
              actions: ({ context, event }) => {
                if ("caller" in event) {
                  // todo need to limit this to only my caller or something?
                  sessionSocket?.send(JSON.stringify(event));
                }
              },
            },
            on: {
              SESSION_UPDATE: {
                actions: assign({
                  sessionSnapshot: ({ event }) => event.snapshot,
                }),
              },
            },
            invoke: {
              id: SESSION_ACTOR_ID,
              src: "listenSession",
              input: () => {
                assert(
                  sessionSocket,
                  "expected sessionSocket to be initialized"
                );
                return {
                  socket: sessionSocket,
                };
              },
            },
          },
        },
      },
      User: {
        initial: "Uninitialized",
        states: {
          Uninitialized: {
            always: "Initializing",
          },
          Initializing: {
            invoke: {
              src: "initializeUserSocket",
              input: ({ context }) => {
                return {
                  userAccessToken: context.userAccessToken,
                  parties,
                  caller: context.initialCaller,
                };
              },
              onDone: {
                target: "Running",
                actions: ({ event }) => {
                  userSocket = event.output;
                },
              },
            },
          },
          Running: {
            always: {
              actions: ({ context, event }) => {
                if ("caller" in event) {
                  // todo need to limit this to only my caller or something?
                  userSocket?.send(JSON.stringify(event));
                }
              },
            },
            on: {
              USER_UPDATE: {
                actions: assign({
                  userSnapshot: ({ event }) => event.snapshot,
                }),
              },
            },
            invoke: {
              id: USER_ACTOR_ID,
              src: "listenUser",
              input: ({ context }) => {
                assert(userSocket, "expected userSocket to be initialized");
                return {
                  socket: userSocket,
                };
              },
            },
          },
        },
      },

      UserPreferences: {
        initial: "Uninitialized",
        on: {
          UPDATE_USER_PREFERENCE: {
            target: ".Holding",
            actions: assign(({ event, context }) =>
              produce(context, (draft) => {
                // Utilize the key from the event to decide which preference to update
                switch (event.key) {
                  case "dietaryRestrictions":
                    draft.userPreferences.dietaryRestrictions = event.value[0];
                    draft.modifiedPreferences.dietaryRestrictions = true;
                    break;
                  case "cuisinePreferences":
                    draft.userPreferences.cuisinePreferences = event.value[0];
                    draft.modifiedPreferences.cuisinePreferences = true;
                    break;
                  case "cookingFrequency":
                    draft.userPreferences.cookingFrequency = event.value[0];
                    draft.modifiedPreferences.cookingFrequency = true;
                    break;
                  case "cookingEquipment":
                    draft.userPreferences.cookingEquipment = event.value[0];
                    draft.modifiedPreferences.cookingEquipment = true;
                    break;
                  case "ingredientPreference":
                    draft.userPreferences.ingredientPreference = event.value[0];
                    draft.modifiedPreferences.ingredientPreference = true;
                    break;
                  case "timeAvailability":
                    draft.userPreferences.timeAvailability = event.value[0];
                    draft.modifiedPreferences.timeAvailability = true;
                    break;
                  case "skillLevel":
                    draft.userPreferences.skillLevel = event.value[0];
                    draft.modifiedPreferences.skillLevel = true;
                    break;
                  default:
                    throw new Error(`Unhandled preference key: ${event.key}`);
                }
              })
            ),
          },
        },
        states: {
          Uninitialized: {
            on: {
              CONNECT: [
                {
                  target: "Initializing",
                  guard: ({ event }) => event.caller.type === "user",
                },
                {
                  target: "Idle",
                },
              ],
            },
          },
          Initializing: {
            invoke: {
              src: "getUserPreferences",
              input: ({ event }) => {
                assert("caller" in event, "expected event to have caller");
                return { userId: event.caller.id };
              },
              onDone: {
                target: "Idle",
                actions: assign(({ context, event }) =>
                  produce(context, (draft) => {
                    event.output.forEach(
                      ({ preferenceKey, preferenceValue }) => {
                        if (preferenceValue) {
                          draft.userPreferences[preferenceKey] =
                            preferenceValue[0];
                        }
                      }
                    );
                  })
                ),
              },
            },
          },
          Idle: {},
          Holding: {
            after: {
              5000: "Saving",
            },
          },
          Saving: {
            invoke: {
              src: "updateUserPreferences",
              input: ({ context }) => {
                const preferenceTypes = Object.keys(
                  context.modifiedPreferences
                ) as (keyof typeof context.modifiedPreferences)[];
                const preferences = preferenceTypes
                  .map((type) => {
                    return {
                      type,
                      value: context.userPreferences[type]!,
                    };
                  })
                  .filter((pref) => {
                    return !!pref.value;
                  });

                return {
                  preferences,
                  userId: context.uniqueId,
                };
              },
              onDone: {
                target: "Idle",
                actions: assign(({ context }) =>
                  produce(context, (draft) => {
                    // todo possible we lose a save here, need to rethink this logic
                    // if a modify comes in whiel were saving, we might wipe it otu
                    draft.modifiedPreferences = {};
                  })
                ),
              },
            },
          },
        },
      },

      Craft: {
        type: "parallel",
        states: {
          Input: {
            on: {
              // PREV: {
              //   actions: assign(({ context }) => {
              //     return produce(context, (draft) => {
              //       assert(
              //         context.currentItemIndex > 0,
              //         "expected non 0 currentItemIndex"
              //       );
              //       draft.currentItemIndex = draft.currentItemIndex - 1;
              //     });
              //   }),
              // },
              // SCROLL_INDEX: {
              //   actions: assign({
              //     currentItemIndex: ({ event }) => event.index,
              //   }),
              // },
              // NEXT: {
              //   actions: assign({
              //     currentItemIndex: ({ context }) =>
              //       context.currentItemIndex + 1,
              //     // undoOperations: ({ context, event }) => [
              //     //   ...context.undoOperations,
              //     //   compare(
              //     //     {
              //     //       prompt: context.prompt,
              //     //       tokens: context.tokens,
              //     //       currentItemIndex: context.currentItemIndex + 1,
              //     //     },
              //     //     {
              //     //       prompt: context.prompt,
              //     //       tokens: context.tokens,
              //     //       currentItemIndex: context.currentItemIndex,
              //     //     }
              //     //   ),
              //     // ],
              //   }),
              // },
              CLEAR: [
                {
                  guard: ({ event }) => !!event.all,
                  actions: [
                    "resetSuggestions",
                    assign({
                      prompt: "",
                      tokens: [],
                      undoOperations: ({ context, event }) => [
                        ...context.undoOperations,
                        compare(
                          {
                            prompt: "",
                            tokens: [],
                            currentItemIndex: context.currentItemIndex,
                          },
                          {
                            prompt: context.prompt,
                            tokens: context.tokens,
                            currentItemIndex: context.currentItemIndex,
                          }
                        ),
                      ],
                    }),
                  ],
                },
                {
                  actions: [
                    "resetSuggestions",
                    assign({
                      prompt: "",
                      undoOperations: ({ context, event }) => [
                        ...context.undoOperations,
                        compare(
                          {
                            prompt: "",
                            tokens: context.tokens,
                            currentItemIndex: context.currentItemIndex,
                          },
                          {
                            prompt: context.prompt,
                            tokens: context.tokens,
                            currentItemIndex: context.currentItemIndex,
                          }
                        ),
                      ],
                    }),
                  ],
                },
              ],
              NEW_RECIPE: {
                guard: ({ event }) => !!event.prompt,
                actions: [
                  "resetSuggestions",
                  assign({
                    prompt: ({ event }) => event.prompt || "",
                  }),
                ],
              },
              REMOVE_TOKEN: {
                actions: [
                  "resetSuggestions",
                  assign({
                    tokens: ({ context, event }) =>
                      context.tokens.filter((token) => token !== event.token),
                    undoOperations: ({ context, event }) => [
                      ...context.undoOperations,
                      compare(
                        {
                          prompt: context.prompt,
                          tokens: context.tokens.filter(
                            (token) => token !== event.token
                          ),
                          currentItemIndex: context.currentItemIndex,
                        },
                        {
                          prompt: context.prompt,
                          tokens: context.tokens,
                          currentItemIndex: context.currentItemIndex,
                        }
                      ),
                    ],
                  }),
                ],
              },
              SUBMIT: {
                guard: ({ event }) => event.name === "prompt",
                actions: [
                  assign(({ context }) => {
                    return produce(context, (draft) => {
                      draft.resultIdsByPrompt[context.prompt] = randomUUID();
                    });
                  }),
                ],
              },
              ADD_TOKEN: {
                actions: [
                  assign(({ context, event }) => {
                    return produce(context, (draft) => {
                      const currentValue = context.prompt;

                      let nextPrompt;
                      if (currentValue.length) {
                        nextPrompt = currentValue + `, ${event.token}`;
                      } else {
                        nextPrompt = event.token;
                      }

                      draft.prompt = nextPrompt;
                      draft.resultIdsByPrompt[nextPrompt] = randomUUID();
                    });
                  }),
                ],
              },
              SET_INPUT: {
                actions: [
                  assign({
                    prompt: ({ event }) => event.value.trim(),
                  }),
                ],
              },
              UPDATE_SEARCH_PARAMS: {
                actions: assign({
                  prompt: ({ event }) => {
                    return event.searchParams["prompt"] || "";
                  },
                }),
              },
            },
          },

          Adding: {
            on: {
              // CHANGE_LIST: {
              //   target: ".True",
              //   actions: assign({
              //     currentListSlug: () => undefined,
              //   }),
              // },
              // SAVE: [
              //   {
              //     guard: ({ event, context }) =>
              //       event.caller.type === "user" && !!context.currentListSlug,
              //     actions: [
              //       spawnChild("saveRecipeToListName", {
              //         input: ({ context, event }) => {
              //           assert("caller" in event, "expected caller");
              //           assert(
              //             event.caller.type === "user",
              //             "expected caller to be user"
              //           );
              //           const userId = event.caller.id;
              //           const recipeId =
              //             context.suggestedRecipes[context.currentItemIndex];
              //           assert(recipeId, "expected recipeId");
              //           assert(
              //             context.currentListSlug,
              //             "expected currentListSlug"
              //           );
              //           // const list = context.listsBySlug?[context.currentListSlug];
              //           assert(
              //             context.listsBySlug,
              //             "expected listsBySlug to be loaded"
              //           );
              //           const currentList =
              //             context.listsBySlug[context.currentListSlug];
              //           assert(currentList, "expected currentList");
              //           return {
              //             recipeId,
              //             userId,
              //             listName: currentList.name,
              //           };
              //         },
              //       }),
              //       "incrementRecipeCountForCurrentList",
              //     ],
              //   },
              //   {
              //     actions: ["assignRecipeIdToSave"],
              //     guard: ({ context }) => {
              //       return !context.currentListSlug;
              //     },
              //     target: ".True",
              //   },
              //   {
              //     actions: ["assignRecipeIdToSave"],
              //   },
              // ],
            },
            initial: "False",
            states: {
              False: {},
              True: {
                on: {
                  // SELECT_LIST: [
                  //   {
                  //     target: "False",
                  //     guard: ({ event }) => event.caller.type === "user",
                  //     actions: [
                  //       "assignListSelection",
                  //       spawnChild("saveRecipeToListName", {
                  //         input: ({ context, event }) => {
                  //           assert("caller" in event, "expected caller");
                  //           assert(
                  //             event.caller.type === "user",
                  //             "expected caller to be user"
                  //           );
                  //           const userId = event.caller.id;

                  //           const recipeId =
                  //             context.suggestedRecipes[context.currentItemIndex];
                  //           assert(recipeId, "expected recipeId");
                  //           assert(
                  //             context.currentListSlug,
                  //             "expected currentListSlug"
                  //           );

                  //           // const list = context.listsBySlug?[context.currentListSlug];
                  //           assert(
                  //             context.listsBySlug,
                  //             "expected listsBySlug to be loaded"
                  //           );
                  //           const currentList =
                  //             context.listsBySlug[context.currentListSlug];
                  //           assert(currentList, "expected currentList");

                  //           return {
                  //             recipeId,
                  //             userId,
                  //             listName: currentList.name,
                  //           };
                  //         },
                  //       }),
                  //     ],
                  //   },
                  //   {
                  //     target: "False",
                  //     actions: "assignListSelection",
                  //   },
                  // ],
                  CANCEL: "False",
                },
              },
            },
          },

          Generators: {
            type: "parallel",
            on: {
              CLEAR: [".Placeholder.Idle", ".Tokens.Idle", ".Recipes.Idle"],
              NEW_RECIPE: {
                target: [
                  ".Placeholder.Generating",
                  ".Tokens.Generating",
                  ".Recipes.Generating",
                ],
                guard: ({ event }) =>
                  !!event.prompt?.length || !!event.tokens?.length,
              },
              SUBMIT: {
                guard: ({ context, event }) =>
                  event.name === "prompt" && context.prompt.length > 0,
                target: [
                  ".Placeholder.Generating",
                  ".Tokens.Generating",
                  ".Recipes.Generating",
                ],
              },
              ADD_TOKEN: {
                target: [
                  ".Placeholder.Generating",
                  ".Tokens.Generating",
                  ".Recipes.Generating",
                ],
              },
              // SET_INPUT: [
              //   {
              //     target: [
              //       ".Placeholder.Holding",
              //       ".Tokens.Holding",
              //       ".Recipes.Holding",
              //     ],
              //     guard: ({ event }) => !!event.value?.length,
              //   },
              //   {
              //     target: [
              //       ".Placeholder.Idle",
              //       ".Tokens.Idle",
              //       ".Recipes.Idle",
              //     ],
              //   },
              // ],
            },
            states: {
              Placeholder: {
                initial: "Idle",
                states: {
                  Idle: {},
                  Holding: {
                    after: {
                      600: {
                        target: "Generating",
                        guard: ({ context }) => !!context.prompt?.length,
                      },
                    },
                  },
                  Generating: {
                    on: {
                      // TAG_START: {
                      //   actions: assign({
                      //     suggestedTagsResultId: ({ event }) => event.resultId,
                      //   }),
                      // },
                      PLACEHOLDER_PROGRESS: {
                        actions: assign({
                          placeholders: ({ event }) => event.data.items || [],
                        }),
                      },
                      PLACEHOLDER_COMPLETE: {
                        actions: assign({
                          placeholders: ({ event }) => event.data.items,
                        }),
                      },
                    },
                    entry: ({ context }) =>
                      captureEvent(context.uniqueId, {
                        type: "LLM_CALL",
                        properties: {
                          llmType: "PLACEHOLDER",
                        },
                      }),
                    invoke: {
                      input: ({ context }) => ({
                        prompt: context.prompt.length
                          ? context.prompt
                          : buildInput(context),
                      }),
                      src: "generatePlaceholders",
                      onDone: {
                        target: "Idle",
                      },
                    },
                  },
                },
              },
              Tokens: {
                initial: "Idle",
                states: {
                  Idle: {},
                  Holding: {
                    after: {
                      500: {
                        target: "Generating",
                        guard: ({ context }) => !!context.prompt?.length,
                      },
                    },
                  },
                  Generating: {
                    entry: ({ context }) =>
                      captureEvent(context.uniqueId, {
                        type: "LLM_CALL",
                        properties: {
                          llmType: "AUTO_SUGGEST_TOKENS",
                        },
                      }),
                    on: {
                      AUTO_SUGGEST_TOKENS_PROGRESS: {
                        actions: assign({
                          results: ({ context, event }) => {
                            const resultId = getCurrentResultId(context);
                            return produce(context.results, (draft) => {
                              const results = draft[resultId];
                              assert(
                                results && results.suggestedTokens,
                                "expected result"
                              );
                              results.suggestedTokens = event.data.tokens || [];
                            });
                          },
                        }),
                      },
                      AUTO_SUGGEST_TOKENS_COMPLETE: {
                        actions: assign({
                          results: ({ context, event }) => {
                            const resultId = getCurrentResultId(context);
                            return produce(context.results, (draft) => {
                              const results = draft[resultId];
                              assert(
                                results && results.suggestedTokens,
                                "expected result"
                              );
                              results.suggestedTokens = event.data.tokens || [];
                            });
                          },
                        }),
                      },
                    },
                    invoke: {
                      input: ({ context }) => ({
                        prompt: buildInput(context),
                      }),
                      src: "generateTokens",
                      onDone: {
                        target: "Idle",
                      },
                    },
                  },
                },
              },

              NextHomeFeedItem: {
                on: {
                  VIEW_RECIPE: {
                    guard: "nextRecipeInCategoryShouldBeCreated",
                    actions: [
                      spawnChild("generateFullRecipeFromSuggestion", {
                        input: ({ context, event }) => {
                          assertEvent(event, "VIEW_RECIPE");
                          const feedItems =
                            context.sessionSnapshot?.context.feedItemsById;
                          assert(feedItems, "expected feedItems");

                          const feedItem = Object.values(feedItems).find(
                            (item) =>
                              item.recipes?.find(
                                (recipe) => recipe?.id === event.id
                              )
                          );
                          assert(feedItem, "expected feedItem");
                          assert(
                            feedItem.category,
                            "expected category in feedItem"
                          );

                          const recipes = feedItem?.recipes;
                          assert(recipes, "expected recipes in feedItem");

                          // Find the index of the current recipe
                          const currentIndex = recipes.findIndex(
                            (recipe) => recipe?.id === event.id
                          );
                          assert(
                            currentIndex >= 0,
                            "expected to find current recipe index"
                          );

                          const recipeIds = recipes.map(
                            (recipe) => recipe?.id!
                          );
                          const unstartedRecipes = getSortedUnstartedRecipes(
                            recipeIds,
                            currentIndex,
                            context
                          );
                          const nextRecipeId = unstartedRecipes[0];
                          const nextRecipe = recipes.find(
                            (recipe) => recipe?.id === nextRecipeId
                          );
                          assert(nextRecipe, "expected to find next recipe");
                          assert(
                            nextRecipe.id,
                            "expected to find next recipe id"
                          );
                          assert(
                            nextRecipe.name,
                            "expected to find next recipe name"
                          );
                          assert(
                            nextRecipe.tagline,
                            "expected to find next recipe tagline"
                          );

                          return {
                            id: nextRecipe.id,
                            category: feedItem.category,
                            name: nextRecipe.name,
                            tagline: nextRecipe.tagline,
                          };
                        },
                      }),
                      assign(({ context, event }) =>
                        produce(context, (draft) => {
                          const feedItems =
                            context.sessionSnapshot?.context.feedItemsById;
                          assert(feedItems, "expected feedItems");

                          const feedItem = Object.values(feedItems).find(
                            (item) =>
                              item.recipes?.find(
                                (recipe) => recipe?.id === event.id
                              )
                          );
                          assert(feedItem, "expected feedItem");
                          assert(
                            feedItem.category,
                            "expected category in feedItem"
                          );

                          const recipes = feedItem?.recipes;
                          assert(recipes, "expected recipes in feedItem");

                          // Find the index of the current recipe
                          const currentIndex = recipes.findIndex(
                            (recipe) => recipe?.id === event.id
                          );
                          assert(
                            currentIndex >= 0,
                            "expected to find current recipe index"
                          );

                          const recipeIds = recipes.map(
                            (recipe) => recipe?.id!
                          );
                          const unstartedRecipes = getSortedUnstartedRecipes(
                            recipeIds,
                            currentIndex,
                            context
                          );
                          const nextRecipeId = unstartedRecipes[0];
                          const nextRecipe = recipes.find(
                            (recipe) => recipe?.id === nextRecipeId
                          );
                          assert(nextRecipe, "expected to find next recipe");
                          assert(nextRecipe.id, "expected to find id");

                          draft.recipes[nextRecipe.id] = {
                            ...nextRecipe,
                            id: nextRecipe.id,
                            versionId: 0,
                            started: true,
                            fullStarted: true,
                            complete: false,
                            matchPercent: undefined,
                            metadataComplete: false,
                          };
                        })
                      ),
                    ],
                  },
                },
              },

              NextNextHomeFeedItem: {
                on: {
                  VIEW_RECIPE: {
                    guard: "nextRecipeInCategoryShouldBeCreated",
                    actions: [
                      spawnChild("generateFullRecipeFromSuggestion", {
                        input: ({ context, event }) => {
                          assertEvent(event, "VIEW_RECIPE");
                          const feedItems =
                            context.sessionSnapshot?.context.feedItemsById;
                          assert(feedItems, "expected feedItems");

                          const feedItem = Object.values(feedItems).find(
                            (item) =>
                              item.recipes?.find(
                                (recipe) => recipe?.id === event.id
                              )
                          );
                          assert(feedItem, "expected feedItem");
                          assert(
                            feedItem.category,
                            "expected category in feedItem"
                          );

                          const recipes = feedItem?.recipes;
                          assert(recipes, "expected recipes in feedItem");

                          // Find the index of the current recipe
                          const currentIndex = recipes.findIndex(
                            (recipe) => recipe?.id === event.id
                          );
                          assert(
                            currentIndex >= 0,
                            "expected to find current recipe index"
                          );

                          const recipeIds = recipes.map(
                            (recipe) => recipe?.id!
                          );
                          const unstartedRecipes = getSortedUnstartedRecipes(
                            recipeIds,
                            currentIndex,
                            context
                          );
                          const nextRecipeId = unstartedRecipes[0];
                          const nextRecipe = recipes.find(
                            (recipe) => recipe?.id === nextRecipeId
                          );
                          assert(nextRecipe, "expected to find next recipe");
                          assert(
                            nextRecipe.id,
                            "expected to find next recipe id"
                          );
                          assert(
                            nextRecipe.name,
                            "expected to find next recipe name"
                          );
                          assert(
                            nextRecipe.tagline,
                            "expected to find next recipe tagline"
                          );

                          return {
                            id: nextRecipe.id,
                            category: feedItem.category,
                            name: nextRecipe.name,
                            tagline: nextRecipe.tagline,
                          };
                        },
                      }),
                      assign(({ context, event }) =>
                        produce(context, (draft) => {
                          const feedItems =
                            context.sessionSnapshot?.context.feedItemsById;
                          assert(feedItems, "expected feedItems");

                          const feedItem = Object.values(feedItems).find(
                            (item) =>
                              item.recipes?.find(
                                (recipe) => recipe?.id === event.id
                              )
                          );
                          assert(feedItem, "expected feedItem");
                          assert(
                            feedItem.category,
                            "expected category in feedItem"
                          );

                          const recipes = feedItem?.recipes;
                          assert(recipes, "expected recipes in feedItem");

                          // Find the index of the current recipe
                          const currentIndex = recipes.findIndex(
                            (recipe) => recipe?.id === event.id
                          );
                          assert(
                            currentIndex >= 0,
                            "expected to find current recipe index"
                          );

                          const recipeIds = recipes.map(
                            (recipe) => recipe?.id!
                          );
                          const unstartedRecipes = getSortedUnstartedRecipes(
                            recipeIds,
                            currentIndex,
                            context
                          );
                          const nextRecipeId = unstartedRecipes[0];
                          const nextRecipe = recipes.find(
                            (recipe) => recipe?.id === nextRecipeId
                          );
                          assert(nextRecipe, "expected to find next recipe");
                          assert(nextRecipe.id, "expected to find id");

                          draft.recipes[nextRecipe.id] = {
                            ...nextRecipe,
                            id: nextRecipe.id,
                            versionId: 0,
                            started: true,
                            fullStarted: true,
                            complete: false,
                            matchPercent: undefined,
                            metadataComplete: false,
                          };
                        })
                      ),
                    ],
                  },
                },
              },

              Recipes: {
                initial: "Idle",
                on: {
                  VIEW_RECIPE: [
                    {
                      description:
                        "recipe doesnt yet exist but it was a suggestion",
                      guard: ({ context, event }) => {
                        const recipe = context.recipes?.[event.id];
                        return !recipe;
                      },
                      actions: [
                        spawnChild("generateFullRecipeFromSuggestion", {
                          input: ({ context, event }) => {
                            assertEvent(event, "VIEW_RECIPE");
                            const feedItems =
                              context.sessionSnapshot?.context.feedItemsById;
                            assert(feedItems, "expected feedItems");
                            const feedItem = Object.values(feedItems).find(
                              (item) =>
                                item.recipes?.find(
                                  (recipe) => recipe?.id === event.id
                                )
                            );
                            assert(feedItem, "expected feedItem");
                            assert(
                              feedItem.category,
                              "expected category in feedItem"
                            );
                            const recipe = feedItem?.recipes?.find(
                              (recipe) => recipe?.id === event.id
                            );
                            assert(
                              recipe,
                              "expected to matching recipe in feedItem"
                            );
                            assert(recipe.id, "expected to find recipe.name");
                            assert(recipe.name, "expected to find recipe.name");
                            assert(
                              recipe.tagline,
                              "expected to find recipe.tagline"
                            );

                            return {
                              id: recipe.id,
                              category: feedItem.category,
                              name: recipe.name,
                              tagline: recipe.tagline,
                            };
                          },
                        }),
                        assign(({ context, event }) =>
                          produce(context, (draft) => {
                            const feedItems =
                              context.sessionSnapshot?.context.feedItemsById;
                            assert(feedItems, "expected feedItems");
                            const feedItem = Object.values(feedItems).find(
                              (item) =>
                                item.recipes?.find(
                                  (recipe) => recipe?.id === event.id
                                )
                            );
                            assert(feedItem, "expected feedItem");
                            assert(
                              feedItem.category,
                              "expected category in feedItem"
                            );
                            const recipe = feedItem?.recipes?.find(
                              (recipe) => recipe?.id === event.id
                            );
                            assert(
                              recipe,
                              "expected to matching recipe in feedItem"
                            );

                            draft.recipes[event.id] = {
                              ...recipe,
                              id: event.id,
                              versionId: 0,
                              started: true,
                              fullStarted: true,
                              complete: false,
                              matchPercent: undefined,
                              metadataComplete: false,
                            };
                          })
                        ),
                      ],
                    },
                    {
                      guard: ({ context, event }) => {
                        const recipe = context.recipes?.[event.id];
                        assert(
                          recipe,
                          "expected recipe to exist when viewing full"
                        );

                        return !recipe.fullStarted;
                      },
                      actions: [
                        spawnChild("generateFullRecipe", {
                          input: ({ context, event }) => {
                            assert(
                              event.type === "VIEW_RECIPE",
                              "expected event to be view recipe"
                            );

                            const recipe = context.recipes[event.id];
                            assert(
                              recipe?.name,
                              "expected recipe to have name when generating full recipe"
                            );
                            assert(
                              recipe.description,
                              "expected recipe to have description when generating full recipe"
                            );
                            assert(recipe.id, "expected recipe to have an id");

                            return {
                              prompt: context.prompt,
                              tokens: context.tokens,
                              id: recipe.id,
                              name: recipe.name,
                              description: recipe.description,
                            };
                          },
                        }),
                        assign(({ context, event }) =>
                          produce(context, (draft) => {
                            const recipe = draft.recipes[event.id];
                            assert(
                              recipe,
                              "expected recipe when updating recipe progress"
                            );
                            draft.recipes[event.id] = {
                              ...recipe,
                              fullStarted: true,
                            };
                          })
                        ),
                      ],
                    },
                  ],
                },
                states: {
                  Idle: {},
                  Generating: {
                    entry: assign(({ context, event }) =>
                      produce(context, (draft) => {
                        const resultId = getCurrentResultId(context);
                        assert(resultId, "expected resultId when generating");

                        const suggestedRecipes = [
                          randomUUID(),
                          randomUUID(),
                          randomUUID(),
                          randomUUID(),
                          randomUUID(),
                          randomUUID(),
                        ];

                        if (!draft.results[resultId]) {
                          draft.results[resultId] = {
                            suggestedRecipes,
                            suggestedTokens: [],
                          };
                        } else {
                          draft.results[resultId]!.suggestedRecipes =
                            suggestedRecipes;
                        }

                        suggestedRecipes.forEach((id, index) => {
                          draft.recipes[id] = {
                            id,
                            versionId: 0,
                            started: index === 0,
                            fullStarted: index === 0,
                            complete: false,
                            matchPercent: undefined,
                            metadataComplete: false,
                          };
                        });
                      })
                    ),
                    type: "parallel",
                    on: {
                      FULL_RECIPE_PROGRESS: {
                        actions: [
                          assign(({ context, event }) =>
                            produce(context, (draft) => {
                              const recipe = draft.recipes[event.id];
                              assert(
                                recipe,
                                "expected recipe when updating full recipe progress"
                              );
                              draft.recipes[event.id] = {
                                ...recipe,
                                ...event.data,
                              };
                            })
                          ),
                        ],
                      },
                      FULL_RECIPE_COMPLETE: {
                        actions: [
                          assign(({ context, event }) =>
                            produce(context, (draft) => {
                              const recipe = draft.recipes[event.id];
                              assert(recipe, "expected recipe");
                              assert(recipe.name, "expected recipe name");
                              draft.recipes[event.id] = {
                                ...recipe,
                                ...event.data,
                                slug: getSlug({
                                  id: recipe.id,
                                  name: recipe.name,
                                }),
                                complete: true,
                              };
                            })
                          ),
                          spawnChild("createNewRecipe", {
                            input: ({ context, event }) => {
                              assert(
                                event.type === "FULL_RECIPE_COMPLETE",
                                "expected recipe to be created"
                              );
                              const recipe = context.recipes[event.id];

                              assert(
                                recipe,
                                "expected recipe with id when reating"
                              );

                              return {
                                recipe,
                                prompt: context.prompt,
                                tokens: context.tokens,
                                createdBy: context.uniqueId,
                              };
                            },
                          }),
                        ],
                      },
                    },
                    states: {
                      InstantRecipe: {
                        initial: "Generating",
                        states: {
                          Generating: {
                            on: {
                              INSTANT_RECIPE_START: {
                                actions: assign(({ context, event }) =>
                                  produce(context, (draft) => {
                                    const recipe = draft.recipes[event.id];
                                    assert(
                                      recipe,
                                      "expected recipe when updating recipe progress"
                                    );
                                    draft.recipes[event.id] = {
                                      ...recipe,
                                      started: true,
                                    };
                                  })
                                ),
                              },
                              INSTANT_RECIPE_PROGRESS: {
                                actions: [
                                  assign(({ context, event }) =>
                                    produce(context, (draft) => {
                                      const recipe = draft.recipes[event.id];
                                      assert(
                                        recipe,
                                        "expected recipe when updating recipe progress"
                                      );
                                      const metadataComplete =
                                        recipe.metadataComplete ||
                                        !!event.data.yield;
                                      draft.recipes[event.id] = {
                                        ...recipe,
                                        matchPercent: 100,
                                        metadataComplete,
                                        ...event.data,
                                      };
                                    })
                                  ),
                                ],
                              },
                              INSTANT_RECIPE_COMPLETE: {
                                actions: [
                                  assign(({ context, event }) =>
                                    produce(context, (draft) => {
                                      const recipe = draft.recipes[event.id];
                                      assert(recipe, "expected recipe");
                                      assert(
                                        recipe.name,
                                        "expected recipe name"
                                      );
                                      draft.recipes[event.id] = {
                                        ...recipe,
                                        ...event.data,
                                        slug: getSlug({
                                          id: recipe.id,
                                          name: recipe.name,
                                        }),
                                        metadataComplete: true,
                                        complete: true,
                                      };
                                    })
                                  ),
                                  spawnChild("createNewRecipe", {
                                    input: ({ context, event }) => {
                                      assert(
                                        event.type ===
                                          "INSTANT_RECIPE_COMPLETE",
                                        "expected INSTANT_RECIPE_COMPLETE event"
                                      );
                                      const recipe = context.recipes[event.id];

                                      assert(
                                        recipe,
                                        "expected recipe with id when reating"
                                      );

                                      return {
                                        recipe,
                                        prompt: context.prompt,
                                        tokens: context.tokens,
                                        createdBy: context.uniqueId,
                                      };
                                    },
                                  }),
                                ],
                              },
                            },
                            invoke: {
                              input: ({ context, event }) => {
                                const resultId = getCurrentResultId(context);
                                const suggestedRecipes =
                                  context.results[resultId]?.suggestedRecipes;
                                assert(
                                  suggestedRecipes,
                                  "expected suggestedRecipes list"
                                );
                                const recipeId = suggestedRecipes[0];
                                assert(
                                  recipeId,
                                  "expected recipeId to be in suggestedRecipes at index -"
                                );
                                return {
                                  prompt: context.prompt,
                                  recipeId,
                                };
                              },
                              src: "generateInstantRecipe",
                              onDone: "Complete",
                            },
                          },
                          Complete: {
                            type: "final",
                          },
                        },
                      },
                      Metadata: {
                        initial: "Idle",
                        on: {
                          RECIPE_IDEAS_METADATA_START: {
                            actions: assign(({ context, event }) =>
                              produce(context, (draft) => {
                                const suggestedRecipes =
                                  context.results[getCurrentResultId(context)]
                                    ?.suggestedRecipes;
                                assert(
                                  suggestedRecipes,
                                  "expected suggestedRecipes"
                                );
                                const numSuggestedRecipes =
                                  suggestedRecipes.length;
                                suggestedRecipes
                                  .slice(
                                    numSuggestedRecipes - NUM_RECIPES_PER_BATCH
                                  )
                                  .forEach((id) => {
                                    const recipe = draft.recipes[id];
                                    assert(
                                      recipe,
                                      "expected recipe when updating recipe progress"
                                    );
                                    draft.recipes[id] = {
                                      ...recipe,
                                      started: true,
                                    };
                                  });
                              })
                            ),
                          },
                          RECIPE_IDEAS_METADATA_PROGRESS: {
                            actions: assign(({ context, event }) =>
                              produce(context, (draft) => {
                                const suggestedRecipes =
                                  context.results[getCurrentResultId(context)]
                                    ?.suggestedRecipes;
                                assert(
                                  suggestedRecipes,
                                  "expected suggestedRecipes"
                                );
                                const numSuggestedRecipes =
                                  suggestedRecipes.length;
                                suggestedRecipes
                                  .slice(
                                    numSuggestedRecipes - NUM_RECIPES_PER_BATCH
                                  )
                                  .forEach((id, index) => {
                                    const idea = event.data.ideas?.[index];
                                    if (idea) {
                                      const recipe = context.recipes[id];
                                      assert(
                                        recipe,
                                        "expected recipe to exist"
                                      );
                                      draft.recipes[id] = {
                                        ...recipe,
                                        ...idea,
                                      };
                                    }
                                  });
                              })
                            ),
                          },
                          RECIPE_IDEAS_METADATA_COMPLETE: {
                            actions: assign(({ context, event }) =>
                              produce(context, (draft) => {
                                const suggestedRecipes =
                                  context.results[getCurrentResultId(context)]
                                    ?.suggestedRecipes;
                                assert(
                                  suggestedRecipes,
                                  "expected suggestedRecipes"
                                );
                                const numSuggestedRecipes =
                                  suggestedRecipes.length;
                                suggestedRecipes
                                  .slice(
                                    numSuggestedRecipes - NUM_RECIPES_PER_BATCH
                                  )
                                  .forEach((id, index) => {
                                    const idea = event.data.ideas?.[index];
                                    if (idea) {
                                      const recipe = context.recipes[id];
                                      assert(
                                        recipe,
                                        "expected recipe to exist"
                                      );
                                      draft.recipes[id] = {
                                        ...recipe,
                                        ...idea,
                                        metadataComplete: true,
                                      };
                                    }
                                  });
                              })
                            ),
                          },
                        },
                        states: {
                          Idle: {
                            on: {
                              INSTANT_RECIPE_PROGRESS: {
                                target: "Generating",
                                guard: ({ event }) => !!event.data.yield,
                              },
                            },
                          },
                          Generating: {
                            invoke: {
                              input: ({ context }) => {
                                const suggestedRecipes =
                                  context.results[getCurrentResultId(context)]
                                    ?.suggestedRecipes;
                                assert(
                                  suggestedRecipes,
                                  "expected suggestedRecipes"
                                );
                                assert(
                                  suggestedRecipes.length === 6,
                                  "expected there to be 6 suggested recipeIds when generating recipe idea metadata"
                                );
                                const instantRecipeId = suggestedRecipes[0];
                                assert(
                                  instantRecipeId,
                                  "expected instantRecipeId when generating recipe ideas"
                                );
                                const recipe = context.recipes[instantRecipeId];

                                assert(
                                  recipe?.name && recipe?.description,
                                  "expected instant recipe to exist"
                                );

                                return {
                                  prompt: context.prompt,
                                  tokens: context.tokens,
                                  instantRecipe: {
                                    name: recipe.name,
                                    description: recipe.description,
                                    ingredients: recipe.ingredients || [],
                                  },
                                };
                              },
                              src: "generateRecipeIdeasMetadata",
                              onDone: "Complete",
                              onError: "Error",
                            },
                          },
                          Error: { entry: console.error },
                          Complete: {
                            on: {
                              VIEW_RESULT: {
                                guard: "didViewCardNearEnd",
                                actions: [
                                  assign(({ context }) =>
                                    produce(context, (draft) => {
                                      const resultId =
                                        getCurrentResultId(context);
                                      const suggestedRecipes =
                                        draft.results[resultId]
                                          ?.suggestedRecipes;
                                      assert(
                                        suggestedRecipes,
                                        "expected to find existing suggestedRecipes"
                                      );

                                      suggestedRecipes.push(
                                        randomUUID(),
                                        randomUUID(),
                                        randomUUID(),
                                        randomUUID(),
                                        randomUUID()
                                      );

                                      const numSuggestedRecipes =
                                        suggestedRecipes.length;
                                      suggestedRecipes
                                        .slice(
                                          numSuggestedRecipes -
                                            NUM_RECIPES_PER_BATCH
                                        )
                                        .forEach((id) => {
                                          draft.recipes[id] = {
                                            id,
                                            versionId: 0,
                                            started: true,
                                            fullStarted: false,
                                            complete: false,
                                            matchPercent: undefined,
                                            metadataComplete: false,
                                          };
                                        });
                                    })
                                  ),
                                  spawnChild(
                                    "generateMoreRecipeIdeasMetadata",
                                    {
                                      input: ({ context }) => {
                                        const resultId =
                                          context.resultIdsByPrompt[
                                            context.prompt
                                          ];
                                        assert(
                                          resultId,
                                          "expected resultId for " +
                                            context.prompt
                                        );
                                        const result =
                                          context.results[resultId];
                                        assert(
                                          result,
                                          "expected result for resultId " +
                                            resultId
                                        );

                                        const previousRecipes =
                                          result.suggestedRecipes
                                            .map((id) => {
                                              const recipe =
                                                context.recipes[id];

                                              // should rarely happen but todo to fix
                                              return {
                                                name: recipe?.name || "",
                                                description:
                                                  recipe?.description || "",
                                                matchPercent:
                                                  recipe?.matchPercent || 60,
                                              };
                                            })
                                            .filter(
                                              ({ name }) => !!name.length
                                            );

                                        return {
                                          prompt: context.prompt,
                                          previousRecipes,
                                        };
                                      },
                                    }
                                  ),
                                ],
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Auth: {
      //   initial: "Uninitialized",
      //   //  ? "Anonymous" : "LoggedIn",
      //   on: {
      //     // UPDATE_SESSION: {
      //     //   target: ".LoggedIn",
      //     // },
      //   },
      //   states: {
      //     Uninitialized: {
      //       always: [
      //         {
      //           target: "Anonymous",
      //           guard: ({ context }) => context.initialCaller.type === "guest",
      //         },
      //         {
      //           target: "LoggedIn",
      //         },
      //       ],
      //     },
      //     Anonymous: {},
      //     LoggedIn: {},
      //   },
      // },

      Quiz: {
        initial: "Closed",
        states: {
          Closed: {
            on: {
              START_ONBOARDING: "Open",
              ADD_TOKEN: "Open",
            },
          },
          Open: {
            on: {
              CLOSE: "Closed",
            },
          },
        },
      },

      Profile: {
        type: "parallel",

        states: {
          Name: {
            initial: "Uninitialized",
            states: {
              Uninitialized: {
                on: {
                  CONNECT: {
                    target: "Initializing",
                    guard: ({ event }) => {
                      return event.caller.type === "user";
                    },
                  },
                  AUTHENTICATE: {
                    target: "Initializing",
                  },
                },
              },
              Initializing: {
                invoke: {
                  src: "getChefName",
                  input: ({ event }) => {
                    assert("caller" in event, "expected caller");
                    const userId = event.caller.id;
                    return { userId };
                  },
                  onDone: {
                    target: "Initialized",
                    actions: assign({
                      chefname: ({ event }) => {
                        return event.output;
                      },
                    }),
                  },
                },
              },
              Initialized: {},
            },
          },

          Available: {
            initial: "Uninitialized",
            on: {
              CHANGE: {
                target: ".Holding",
                guard: "didChangeChefNameInput",
                actions: assign(({ context, event }) =>
                  produce(context, (draft) => {
                    draft.chefname = event.value;
                  })
                ),
              },
            },
            states: {
              Uninitialized: {},
              No: {},
              Holding: {
                after: {
                  500: {
                    target: "Loading",
                    guard: ({ context }) =>
                      !!context.chefname && context.chefname.length > 0,
                  },
                },
              },
              Loading: {
                invoke: {
                  id: "checkChefNameAvailability",
                  src: "checkChefNameAvailability",
                  input: ({ context }) => {
                    assert(context.chefname, "expected chefname");
                    return {
                      chefname: context.chefname,
                    };
                  },
                  onDone: [
                    {
                      target: "Yes",
                      guard: ({ event }) => event.output,
                    },
                    {
                      target: "No",
                    },
                  ],
                },
              },
              Yes: {},
            },
          },
        },
      },
      Selection: {
        type: "parallel",
        states: {
          Data: {
            on: {
              FULL_RECIPE_FROM_SUGGESTION_PROGRESS: {
                actions: [
                  assign(({ context, event }) =>
                    produce(context, (draft) => {
                      const recipe = draft.recipes[event.id];
                      assert(
                        recipe,
                        "expected recipe when updating full recipe progress"
                      );
                      draft.recipes[event.id] = {
                        ...recipe,
                        metadataComplete: !!event.data.yield,
                        ...event.data,
                      };
                    })
                  ),
                ],
              },
              FULL_RECIPE_FROM_SUGGESTION_COMPLETE: {
                actions: [
                  assign(({ context, event }) =>
                    produce(context, (draft) => {
                      const recipe = draft.recipes[event.id];
                      assert(recipe, "expected recipe");
                      assert(recipe.name, "expected recipe name");
                      draft.recipes[event.id] = {
                        ...recipe,
                        ...event.data,
                        slug: getSlug({
                          id: recipe.id,
                          name: recipe.name,
                        }),
                        complete: true,
                      };
                    })
                  ),
                  spawnChild("createNewRecipe", {
                    input: ({ context, event }) => {
                      assert(
                        event.type === "FULL_RECIPE_FROM_SUGGESTION_COMPLETE",
                        "expected recipe to be created"
                      );
                      const recipe = context.recipes[event.id];

                      assert(recipe, "expected recipe with id when reating");

                      return {
                        recipe,
                        prompt: "suggestion",
                        tokens: context.tokens,
                        createdBy: context.uniqueId,
                      };
                    },
                  }),
                ],
              },
              SELECT_RECIPE_SUGGESTION: {
                description:
                  "Generate full recipe if we don't already have this recipe",
                guard: ({ context, event }) => {
                  const feedItemId =
                    context.sessionSnapshot?.context.feedItemIds[
                      event.itemIndex
                    ];
                  assert(feedItemId, "couldnt find feed item id");
                  const feedItem =
                    context.sessionSnapshot?.context.feedItemsById[feedItemId];
                  assert(feedItem, "expected feedItem");
                  assert(
                    feedItem.category,
                    "expected feedItem to have cateogry"
                  );
                  assert(feedItem.recipes, "expected feedItem to have recipes");
                  const recipe = feedItem.recipes[event.recipeIndex];
                  assert(recipe, "expected to find recipe in feedItem");
                  assert(recipe.id, "expected to find recipe.name");

                  return !context.recipes[recipe.id];
                },
                actions: [
                  spawnChild("generateFullRecipeFromSuggestion", {
                    input: ({ context, event }) => {
                      assertEvent(event, "SELECT_RECIPE_SUGGESTION");
                      const feedItemId =
                        context.sessionSnapshot?.context.feedItemIds[
                          event.itemIndex
                        ];
                      assert(feedItemId, "couldnt find feed item id");
                      const feedItem =
                        context.sessionSnapshot?.context.feedItemsById[
                          feedItemId
                        ];
                      assert(feedItem, "expected feedItem");
                      assert(
                        feedItem.category,
                        "expected feedItem to have cateogry"
                      );
                      assert(
                        feedItem.recipes,
                        "expected feedItem to have recipes"
                      );
                      const recipe = feedItem.recipes[event.recipeIndex];
                      assert(recipe, "expected to find recipe in feedItem");
                      assert(recipe.id, "expected to find recipe.name");
                      assert(recipe.name, "expected to find recipe.name");
                      assert(recipe.tagline, "expected to find recipe.tagline");

                      return {
                        id: recipe.id,
                        category: feedItem.category,
                        name: recipe.name,
                        tagline: recipe.tagline,
                      };
                    },
                  }),
                  assign(({ context, event }) =>
                    produce(context, (draft) => {
                      const feedItemId =
                        context.sessionSnapshot?.context.feedItemIds[
                          event.itemIndex
                        ];
                      assert(feedItemId, "couldnt find feed item id");
                      const feedItem =
                        context.sessionSnapshot?.context.feedItemsById[
                          feedItemId
                        ];
                      assert(feedItem, "expected feedItem");
                      assert(
                        feedItem.category,
                        "expected feedItem to have cateogry"
                      );
                      assert(
                        feedItem.recipes,
                        "expected feedItem to have recipes"
                      );
                      const recipe = feedItem.recipes[event.recipeIndex];
                      assert(recipe, "expected to find recipe in feedItem");
                      assert(recipe.id, "expected to find recipe.name");

                      // assert(recipe.name, "expected to find recipe.name");

                      draft.recipes[recipe.id] = {
                        id: recipe.id,
                        versionId: 0,
                        started: true,
                        matchPercent: undefined,
                        fullStarted: true,
                        complete: false,
                        metadataComplete: false,
                        name: recipe.name,
                      };
                    })
                  ),
                ],
              },
            },
            initial: "Idle",
            states: {
              Idle: {
                on: {
                  SESSION_UPDATE: [
                    {
                      target: "Loading",
                      guard: ({ context, event }) => {
                        // console.log(event);
                        return !!event.snapshot.context.selectedRecipeIds?.filter(
                          (id) => !context.recipes[id]
                        ).length;
                      },
                    },
                    {
                      target: "Complete",
                    },
                  ],
                },
              },
              Loading: {
                invoke: {
                  src: "getRecipes",
                  input: ({ context, event }) => {
                    return {
                      recipeIds: [
                        ...context.sessionSnapshot?.context.selectedRecipeIds?.filter(
                          (id) => !context.recipes[id]
                        )!,
                      ],
                    };
                  },
                  onDone: {
                    target: "Complete",
                    actions: assign(({ context, event }) => {
                      return produce(context, (draft) => {
                        event.output.forEach(({ recipe }) => {
                          if (!draft.recipes[recipe.id]) {
                            draft.recipes[recipe.id] = {
                              ...recipe,
                              matchPercent: undefined,
                              complete: true,
                              started: true,
                              metadataComplete: true,
                              fullStarted: true,
                            };
                          }
                        });
                      });
                    }),
                  },
                },
              },
              Complete: {},
            },
          },
        },
      },

      ListData: {
        initial: "Idle",
        states: {
          Idle: {
            always: {
              target: "Fetching",
              guard: "hasUserId",
            },
          },
          Fetching: {
            invoke: {
              src: "fetchLists",
              input: ({ context }) => {
                const userId = context.userId;
                assert(userId, "expected userId");
                return { userId };
              },
              onDone: {
                target: "Complete",
                actions: assign(({ context, event }) => {
                  return produce(context, (draft) => {
                    const { listRecipes, lists } = event.output;
                    // Group recipes by listId
                    const groupedListRecipes = listRecipes.reduce<
                      Record<string, string[]>
                    >(
                      (acc, recipe) => {
                        let list = acc[recipe.listId];
                        if (!list) {
                          list = [];
                          acc[recipe.listId] = list;
                        }
                        list.push(recipe.recipeId);
                        return acc;
                      },
                      {} as Record<string, string[]>
                    );

                    // Create a map of existing slugs to IDs
                    const existingSlugToId = new Map(
                      Object.entries(draft.listsById).map(([id, list]) => [
                        list.slug,
                        id,
                      ])
                    );

                    // Remove all existing lists that are in the output
                    lists.forEach((list) => {
                      const existingId = existingSlugToId.get(list.slug);
                      if (existingId) {
                        delete draft.listsById[existingId];
                        delete draft.listRecipes[existingId];
                      }
                    });

                    // Add all lists from the output
                    lists.forEach((list) => {
                      const recipeIds = groupedListRecipes[list.id] || [];
                      const idSet = recipeIds.reduce<Record<string, true>>(
                        (acc, id) => {
                          acc[id] = true;
                          return acc;
                        },
                        {}
                      );

                      draft.listsById[list.id] = {
                        ...list,
                        public: true,
                        created: true,
                        count: recipeIds.length,
                      };
                      draft.listRecipes[list.id] = idSet;
                    });
                  });
                }),
              },
            },
          },
          Complete: {
            type: "final",
          },
        },
      },

      ListRecipes: {
        initial: "Idle",
        on: {
          SAVE_RECIPE: {
            actions: [
              assign(({ context, event }) => {
                return produce(context, (draft) => {
                  const currentSaveToListSlug =
                    context.sessionSnapshot?.context.currentSaveToListSlug;
                  assert(
                    currentSaveToListSlug,
                    "expected currentSaveToListSlug to exist when saving recipe"
                  );

                  const draftCurrentList = Object.values(draft.listsById).find(
                    (list) => list.slug === currentSaveToListSlug
                  );
                  assert(
                    draftCurrentList,
                    `expected  to exist for slug ${currentSaveToListSlug}`
                  );

                  const listId = draftCurrentList.id;
                  let draftListRecipes = draft.listRecipes[listId];
                  if (!draftListRecipes) {
                    draftListRecipes = {};
                    draft.listRecipes[listId] = draftListRecipes;
                  }

                  draftListRecipes[event.recipeId] = true;
                  draftCurrentList.count++;
                });
              }),
              spawnChild("saveRecipeToListBySlug", {
                input: ({ context, event }) => {
                  assertEvent(event, "SAVE_RECIPE");
                  assert(context.userId, "expected userId when saving recipe");
                  const listSlug =
                    context.sessionSnapshot?.context.currentSaveToListSlug;
                  assert(
                    listSlug,
                    "expected currentSaveToListSlug when aving recipe"
                  );

                  return {
                    userId: context.userId,
                    recipeId: event.recipeId,
                    listSlug,
                  };
                },
              }),
            ],
          },
          TOGGLE_LIST: {
            actions: assign(({ context, event, self }) => {
              return produce(context, (draft) => {
                const recipeId = context.choosingListsForRecipeId;
                assert(
                  recipeId,
                  "expected recipeId to eo be set when toggle list"
                );
                const draftCurrentList = draft.listsById[event.id];
                assert(draftCurrentList, `expected craftCurrentList to exist`);

                const inList = context.listRecipes[event.id]?.[recipeId];
                if (inList) {
                  const draftListRecipes = draft.listRecipes[event.id];
                  assert(
                    draftListRecipes,
                    "expected draftListRecipes to exist when deleting item from list "
                  );
                  delete draftListRecipes[recipeId];
                  draftCurrentList.count--;
                } else {
                  let draftListRecipes = draft.listRecipes[event.id];
                  if (!draftListRecipes) {
                    draftListRecipes = {};
                    draft.listRecipes[event.id] = draftListRecipes;
                  }
                  draftListRecipes[recipeId] = true;
                  draftCurrentList.count++;
                }
              });
            }),
          },
          // UNLIKE_RECIPE: {
          //   actions: assign(({ context, event, self }) => {
          //     return produce(context, (draft) => {
          //       const likedList = Object.values(context.listsById).find(
          //         (list) => list.slug === "liked"
          //       );
          //       assert(likedList, "expected likedList to exist");
          //       const listId = likedList.id;
          //       let draftListRecipes = draft.listRecipes[listId];
          //       if (draftListRecipes) {
          //         delete draftListRecipes[event.recipeId];
          //       }
          //     });
          //   }),
          // },
        },
        states: {
          Idle: {
            always: {
              guard: ({ context, event }) => {
                const recipeIds =
                  getCurrentListUnfetchedRecipesIdsForListSlug(context);
                return !!context.currentListSlug && !!recipeIds?.length;
              },
              target: "Fetching",
            },
          },
          Fetching: {
            invoke: {
              src: "getRecipes",
              input: ({ context }) => {
                const recipeIds =
                  getCurrentListUnfetchedRecipesIdsForListSlug(context);
                assert(
                  recipeIds?.length,
                  "expected recipeIds to be non-empty when fetching"
                );

                return {
                  recipeIds,
                };
              },
              onDone: {
                target: "Idle",
                actions: assign(({ context, event }) => {
                  return produce(context, (draft) => {
                    event.output.forEach(({ recipe }) => {
                      if (!draft.recipes[recipe.id]) {
                        draft.recipes[recipe.id] = {
                          ...recipe,
                          matchPercent: undefined,
                          complete: true,
                          started: true,
                          metadataComplete: true,
                          fullStarted: true,
                        };
                      }
                    });
                  });
                }),
              },
            },
          },
        },
      },

      ListCreating: {
        initial: "False",
        onDone: ".False",
        states: {
          False: {
            on: {
              CREATE_LIST: "True",
            },
          },
          True: {
            on: {
              CANCEL: "False",
              CHANGE: {
                guard: "didChangeListSlugInput",
                actions: assign({
                  listSlug: ({ event }) => {
                    return event.value;
                  },
                }),
              },
              SUBMIT: {
                target: "Saving",
                guard: ({ event }) => event.name === LIST_SLUG_INPUT_KEY,
                // actions: assign({
                //   currentListSlug: ({ context }) => {
                //     const listName = ListNameSchema.parse(context.listName);
                //     return sentenceToSlug(listName);
                //   },
                // }),
              },
            },
          },
          Saving: {
            invoke: {
              src: "createNewList",
              input: ({ context, event }) => {
                const listSlug = SlugSchema.parse(context.listSlug);
                assert("caller" in event, "expected caller in event");

                const { choosingListsForRecipeId } = context;
                const recipeIdsToAdd = choosingListsForRecipeId
                  ? [choosingListsForRecipeId]
                  : [];

                return {
                  listSlug,
                  userId: event.caller.id,
                  recipeIdsToAdd,
                };
              },
              onDone: {
                target: "Saved",
                actions: [
                  assign(({ context, event }) =>
                    produce(context, (draft) => {
                      const { id, name, icon, slug, createdAt } = event.output;
                      draft.listsById[id] = {
                        id,
                        name,
                        slug,
                        icon,
                        public: true,
                        created: true,
                        count: Object.values(event.output.idSet).length,
                        createdAt,
                      };
                      draft.listRecipes[id] = event.output.idSet;
                    })
                  ),
                  enqueueActions(({ enqueue, event, context }) => {
                    enqueue.raise({
                      type: "LIST_CREATED",
                      id: event.output.id,
                      name: event.output.name,
                      slug: event.output.slug,
                      caller: {
                        id: context.pageSessionId,
                        type: "system",
                      },
                    });
                  }),
                ],
                // actions: raise((f) => {
                //   return {
                //     type: "LIST_CREATED",
                //     id: ""
                //   }
                // })
              },
              onError: "Error",
            },

            // spawnChild("createNewList", {
            //   input: ({ context, event }) => {
            //     const listName = ListNameSchema.parse(
            //       context.listName
            //     );
            //     assert(
            //       "caller" in event,
            //       "expected caller in event"
            //     );

            //     const recipeIdToAdd =
            //       context.suggestedRecipes[
            //         context.currentItemIndex
            //       ];
            //     assert(
            //       recipeIdToAdd,
            //       "expected recipeToAdd when creating list"
            //     );

            //     return {
            //       listName,
            //       userId: event.caller.id,
            //       recipeIdToAdd,
            //     };
            //   },
            // }),
          },
          Error: {
            initial: "Parsing",
            states: {
              Parsing: {
                always: [
                  {
                    target: "DuplicateName",
                    guard: ({ event }) => {
                      if ("error" in event) {
                        const error = DatabaseErrorSchema.parse(event.error);

                        if (error.code === "23505") {
                          return true;
                        }
                      }
                      return false;
                    },
                  },
                  {
                    target: "Unknown",
                  },
                ],
              },
              DuplicateName: {},
              Unknown: {},
            },
            // entry: assign({
            //   errorKeys: ({ context, event }) =>
            //     produce(context.errorKeys, (draft) => {
            //       if ("error" in event) {
            //         const error = DatabaseErrorSchema.parse(event.error);

            //         if (error.code === "23505") {
            //           draft.newListName = "duplicate_name";
            //         } else {
            //           draft.newListName = "unknown";
            //         }
            //       }
            //     }),
            // }),
            // entry: ({ event }) => {
            //   if ("error" in event) {
            //     const error = DatabaseErrorSchema.parse(event.error);
            //     console.log(error);
            //   }
            // },
            on: {
              CHANGE: {
                target: "True",
                guard: "didChangeListSlugInput",
                actions: assign({
                  listSlug: ({ event }) => {
                    return event.value;
                  },
                }),
              },
            },
          },
          Saved: {
            entry: [
              assign({
                listSlug: undefined,
              }),
            ],
            type: "final",
          },
        },
      },

      ListChoosing: {
        on: {
          UPDATE_SEARCH_PARAMS: {
            actions: assign({
              choosingListsForRecipeId: ({ event }) => {
                return (
                  event.searchParams[CHOOSING_LISTS_FOR_RECIPE_ID_PARAM] ||
                  undefined
                );
              },
            }),
          },
        },
      },

      MyRecipes: {
        on: {
          HASH_CHANGE: [
            {
              guard: ({ event }) => !!event.hash.length,
              actions: assign({
                currentListSlug: ({ event }) =>
                  event.hash.length ? event.hash.slice(1) : undefined,
              }),
            },
            {
              actions: assign({
                currentListSlug: () => {
                  return undefined;
                },
              }),
            },
          ],
        },
      },
    },
  });
  return pageSessionMachine;
};

export type PageSessionMachine = ReturnType<typeof createPageSessionMachine>;
export type PageSessionSnapshot = SnapshotFrom<PageSessionMachine>;
export type PageSessionState = StateValueFrom<PageSessionMachine>;

const defaultPlaceholders = [
  "3 eggs",
  "1lb ground beef",
  "2 cups flour",
  "pad thai",
  "curry dish",
  "pasta meal",
  "chicken stew",
  "veggie mix",
  "family meal",
  "6 servings",
  "party size",
  "omelette",
  "pancakes",
  "salad lunch",
  "fruit snack",
  "steak dinner",
  "cook tonight",
  "quick stir-fry",
  "protein-rich",
  "low-cal meal",
  "heart healthy",
  "keto snack",
  "no nuts",
  "dairy-free",
  "gluten-free",
  "lactose-free",
  "bake bread",
  "slow cooker",
  "grilled fish",
  "smoked ribs",
  "kid-friendly",
  "easy recipe",
  "superfoods",
  "without sugar",
  "whole grain",
  "roast veggies",
  "grill bbq",
];

const getChefNameByUserId = async (userId: string) => {
  const client = createClient();
  await client.connect();
  const db = drizzle(client);
  try {
    const query = db
      .select({
        profileSlug: ProfileTable.profileSlug,
      })
      .from(ProfileTable)
      .where(eq(ProfileTable.userId, userId));

    return await withDatabaseSpan(query, "getChefNameByUserId")
      .execute()
      .then((res) => res[0]?.profileSlug); // Return the first (and expectedly only) result
  } finally {
    await client.end();
  }
};

const getProfileBySlug = async (profileSlug: string) => {
  const client = createClient();
  await client.connect();
  const db = drizzle(client);
  try {
    const query = db
      .select({
        profileSlug: ProfileTable.profileSlug,
        activated: ProfileTable.activated,
        mediaId: ProfileTable.mediaId,
        userId: ProfileTable.userId,
        createdAt: ProfileTable.createdAt,
      })
      .from(ProfileTable)
      .where(ilike(ProfileTable.profileSlug, profileSlug)); // Filter by the given profile slug
    return await withDatabaseSpan(query, "getProfileBySlug")
      .execute()
      .then((res) => res[0]); // Return the first (and expectedly only) result
  } finally {
    await client.end();
  }
};

async function upsertUserPreferences(
  userId: string,
  preferences: { type: UserPreferenceType; value: string }[]
) {
  // Start a transaction
  const client = createClient();
  await client.connect();
  const db = drizzle(client);
  try {
    return await db
      .transaction(async (tx) => {
        for (const { type, value } of preferences) {
          await tx
            .insert(UserPreferencesTable)
            .values({
              userId: userId,
              preferenceKey: type,
              preferenceValue: [value],
            })
            .onConflictDoUpdate({
              target: [
                UserPreferencesTable.userId,
                UserPreferencesTable.preferenceKey,
              ],
              set: {
                preferenceValue: value,
                updatedAt: sqlFN`NOW()`, // Update the timestamp to the current time
              },
            })
            .execute();
        }

        // All updates are successful, commit is implicit if no errors occur
        return { success: true }; // You can also return specific data or results if needed
      })
      .catch((error) => {
        console.error("Error upserting user preferences:", error);
        const message = getErrorMessage(error); // Handle the error message appropriately
        return { success: false, error: message };
      });
  } finally {
    await client.end();
  }
}

function getSortedUnstartedRecipes(
  recipeIds: string[],
  currentIndex: number,
  context: PageSessionContext
): string[] {
  const unstartedRecipes: string[] = [];

  // Check for the unstarted recipes after the current index
  for (let i = currentIndex + 1; i < recipeIds.length; i++) {
    const recipeId = recipeIds[i];
    if (recipeId && !context.recipes?.[recipeId]?.fullStarted) {
      unstartedRecipes.push(recipeId);
    }
  }

  // Check from the beginning up to the current index
  for (let i = 0; i < currentIndex; i++) {
    const recipeId = recipeIds[i];
    if (recipeId && !context.recipes?.[recipeId]?.fullStarted) {
      unstartedRecipes.push(recipeId);
    }
  }

  return unstartedRecipes;
}

const initializeListsById = () => {
  const createdAt = new Date();

  return defaultLists.reduce(
    (obj, item) => {
      const id = randomUUID();
      obj[id] = {
        id,
        createdAt,
        created: false,
        count: 0,
        name: slugToSentence(item.slug),
        ...item,
      };

      return obj;
    },
    {} as Record<string, List>
  );

  // return {
  //   [likedId]: {
  //     id: likedId,
  //     name: "Liked",
  //     icon: "👍",
  //     slug: "liked",
  //     created: false,
  //     public: false,
  //     count: 0,
  //     createdAt: new Date(),
  //   },
  //   [makeLaterId]: {
  //     id: makeLaterId,
  //     name: "Make Later",
  //     icon: "⏰",
  //     slug: "make-later",
  //     public: false,
  //     created: false,
  //     count: 0,
  //     createdAt: new Date(),
  //   },
  //   [favoritesId]: {
  //     id: favoritesId,
  //     name: "Favorites",
  //     icon: "⭐️",
  //     slug: "favorites",
  //     public: true,
  //     created: false,
  //     count: 0,
  //     createdAt: new Date(),
  //   },
  //   [commented]: {
  //     id: commented,
  //     name: "Commented",
  //     icon: "💬",
  //     public: true,
  //     slug: "commented",
  //     created: false,
  //     count: 0,
  //     createdAt: new Date(),
  //   },
  // } satisfies PageSessionContext["listsById"];
};

const getCurrentResultId = (context: PageSessionContext) => {
  const resultId = context.resultIdsByPrompt[context.prompt];
  assert(resultId, "expected resultId");
  return resultId;
};

const getCurrentListUnfetchedRecipesIdsForListSlug = (
  context: PageSessionContext
) => {
  const listsById = context.listsById;
  if (!listsById || !context.currentListSlug) {
    return undefined;
  }

  const list = Object.values(listsById).find(
    (list) => list.slug === context.currentListSlug
  );

  if (!list) {
    return undefined;
  }

  const idSet = context.listRecipes[list.id];
  if (!idSet) {
    return undefined;
  }

  const recipeIds = Object.keys(idSet).filter((id) => !context.recipes[id]);
  return recipeIds;
};
