import { ListRecipeTable, ListTable, UserPreferencesTable, db } from "@/db";
import { createCallerToken } from "@/lib/browser-session";
import { getErrorMessage } from "@/lib/error";
import { withDatabaseSpan } from "@/lib/observability";
import { streamToObservable } from "@/lib/stream-to-observable";
import { assert } from "@/lib/utils";
import { Caller, DbOrTransaction, ServerPartySocket } from "@/types";
import { and, desc, eq, sql } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { Operation, applyPatch } from "fast-json-patch";
import { produce } from "immer";
import { jwtVerify } from "jose";
import type * as Party from "partykit/server";
import { Subject, from, switchMap } from "rxjs";
import {
  AnyStateMachine,
  SnapshotFrom,
  fromEventObservable,
  fromPromise,
} from "xstate";
import { z } from "zod";
import { browserSessionMachine } from "./browser-session-machine";
import {
  SuggestChefNamesOutputSchema,
  SuggestChefNamesStream,
} from "./suggest-chef-names-stream";
import {
  SuggestListNamesOutputSchema,
  SuggestListNamesStream,
} from "./suggest-list-names-stream";

export const getAllListsForUserWithRecipeCount = fromPromise(
  async ({ input }: { input: { userId: string } }) => {
    try {
      const result = await db
        .select({
          id: ListTable.id,
          name: ListTable.name,
          slug: ListTable.slug,
          createdAt: ListTable.createdAt,
          recipeCount: sql<number>`COUNT(${ListRecipeTable.recipeId})`,
        })
        .from(ListTable)
        .leftJoin(ListRecipeTable, eq(ListTable.id, ListRecipeTable.listId))
        .where(eq(ListTable.createdBy, input.userId))
        .groupBy(ListTable.id)
        .orderBy(desc(ListTable.createdAt))
        .execute();

      return { success: true, result };
    } catch (error) {
      console.error("Error retrieving lists with recipe count:", error);
      return { success: false, error: getErrorMessage(error) };
    }
  }
);

export const saveRecipeToListSlug = fromPromise(
  async ({
    input,
  }: {
    input: {
      recipeId: string;
      userId: string;
      listSlug: string;
    };
  }) => {
    const result = await ensureListWithSlugExists(
      db,
      input.userId,
      input.listSlug
    );
    if (result.error) {
      console.error(result.error);
    }
    assert(result.success, "expected to get listId");

    await createListRecipe(db, input.userId, input.recipeId, result.listId);
  }
);

const ensureListWithSlugExists = async (
  dbOrTransaction: DbOrTransaction,
  userId: string,
  slug: string
) => {
  const queryRunner =
    dbOrTransaction instanceof PgTransaction ? dbOrTransaction : db;

  try {
    // First, attempt to find the user's "My Cookbook" list.
    let result = await withDatabaseSpan(
      queryRunner
        .select({
          id: ListTable.id,
        })
        .from(ListTable)
        .where(and(eq(ListTable.slug, slug), eq(ListTable.createdBy, userId))),
      "findMyRecipesList"
    ).execute();

    // If the list exists, return the list ID.
    let item = result[0];
    if (item) {
      return { success: true, listId: item.id } as const;
    }

    // If the list does not exist, create it.
    result = await withDatabaseSpan(
      queryRunner.insert(ListTable).values({
        slug: "my-cookbook",
        name: "My Cookbook",
        createdBy: userId,
        createdAt: sql`NOW()`, // Automatically set the creation time to now
      }),
      "createMyCookbook"
    ).execute();

    item = result[0];

    if (!item) {
      console.error(result);
      return {
        success: false,
        error: "was not able to insert my-cookbook list",
      } as const;
    }

    return { success: true, listId: item.id } as const;
  } catch (error) {
    return { success: false, error: getErrorMessage(error) } as const;
  }
};

const createListRecipe = async (
  dbOrTransaction: DbOrTransaction,
  userId: string,
  recipeId: string,
  listId: string
) => {
  const queryRunner =
    dbOrTransaction instanceof PgTransaction ? dbOrTransaction : db;

  try {
    const result = await withDatabaseSpan(
      queryRunner
        .insert(ListRecipeTable)
        .values({
          userId: userId,
          recipeId: recipeId,
          listId: listId,
          addedAt: sql`NOW()`, // Automatically set the added time to now
        })
        // Handling potential unique constraint violation
        .onConflictDoNothing({
          target: [ListRecipeTable.listId, ListRecipeTable.recipeId],
        }),
      "createListRecipe"
    ).execute();

    if (result.count === 0) {
      throw new Error("This recipe is already in the list.");
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
};

export const generateChefNameSuggestions = fromEventObservable(
  ({
    input,
  }: {
    input: {
      email: string;
      previousSuggestions: string[];
      prompt: string;
      tokens: string[];
      selectedRecipe: { name: string; description: string };
      personalizationContext: string | undefined;
    };
  }) => {
    const tokenStream = new SuggestChefNamesStream();
    return from(tokenStream.getStream(input)).pipe(
      switchMap((stream) => {
        return streamToObservable(
          stream,
          "SUGGEST_CHEF_NAMES",
          SuggestChefNamesOutputSchema
        );
      })
    );
  }
);

export const generateListNameSuggestions = fromEventObservable(
  ({
    input,
  }: {
    input: {
      previousSuggestions: string[];
      prompt: string;
      tokens: string[];
      selectedRecipe: { name: string; description: string };
    };
  }) => {
    const tokenStream = new SuggestListNamesStream();
    return from(tokenStream.getStream(input)).pipe(
      switchMap((stream) => {
        return streamToObservable(
          stream,
          "SUGGEST_LIST_NAMES",
          SuggestListNamesOutputSchema
        );
      })
    );
  }
);

type WithConnect<T extends string> = `${T}_CONNECT`;
type WithUpdate<T extends string> = `${T}_UPDATE`;
type WithDisconnect<T extends string> = `${T}_DISCONNECT`;
type WithError<T extends string> = `${T}_ERROR`;

type ActorSocketEvent<
  TEventType extends string,
  TMachine extends AnyStateMachine,
> =
  | {
      type: WithConnect<TEventType>;
      resultId: string;
    }
  | {
      type: WithUpdate<TEventType>;
      snapshot: SnapshotFrom<TMachine>;
      operations: Operation[];
    }
  | {
      type: WithError<TEventType>;
    }
  | {
      type: WithDisconnect<TEventType>;
    };

export const initializeBrowserSessionSocket = fromPromise(
  async ({
    input,
  }: {
    input: {
      browserSessionToken: string;
      caller: Caller;
      partyContext: Party.Context;
    };
  }) => {
    const sessionId = (
      await parseBrowserSessionToken(input.browserSessionToken)
    ).payload.jti;
    assert(sessionId, "expected session id when listening for browser session");
    // const party = input.getBrowserSessionParty(sessionId);
    const token = await createCallerToken(input.caller.id, input.caller.type);
    const socket = await input.partyContext.parties
      .browser_session!.get(sessionId)
      .socket({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    return socket;
  }
);

export type BrowserSessionActorSocketEvent = ActorSocketEvent<
  "BROWSER_SESSION",
  typeof browserSessionMachine
>;

export const listenBrowserSession = fromEventObservable(
  ({
    input,
  }: {
    input: {
      socket: ServerPartySocket;
    };
  }) => {
    const subject = new Subject<BrowserSessionActorSocketEvent>();
    const { socket } = input;

    socket.addEventListener("error", (error) => {
      console.error("error", error);
    });

    let currentSnapshot:
      | SnapshotFrom<typeof browserSessionMachine>
      | undefined = undefined;

    socket.addEventListener("message", (message) => {
      assert(
        typeof message.data === "string",
        "expected message data to be a string"
      );

      const { operations } = z
        .object({ operations: z.array(z.custom<Operation>()) })
        .parse(JSON.parse(message.data));

      const nextSnapshot = produce(currentSnapshot || {}, (draft) => {
        applyPatch(draft, operations);
      });
      subject.next({
        type: "BROWSER_SESSION_UPDATE",
        snapshot: nextSnapshot as any,
        operations,
      });
      currentSnapshot = nextSnapshot as any;
    });

    socket.addEventListener("close", () => {
      subject.next({ type: "BROWSER_SESSION_DISCONNECT" });
    });

    return subject;
  }
);

const parseBrowserSessionToken = async (token: string) => {
  const verified = await jwtVerify(
    token,
    new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
  );
  assert(verified.payload.jti, "expected JTI on BrowserSessionToken");
  return verified;
};

export const getUserPreferences = fromPromise(
  async ({
    input,
  }: {
    input: {
      userId: string;
    };
  }) => {
    const result = await db
      .select()
      .from(UserPreferencesTable)
      .where(eq(UserPreferencesTable.userId, input.userId))
      .execute();
    return result;
  }
);
