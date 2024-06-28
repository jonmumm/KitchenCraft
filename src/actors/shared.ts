import { ListRecipeTable, ListTable, UserPreferencesTable } from "@/db";
import { getErrorMessage } from "@/lib/error";
import { withDatabaseSpan } from "@/lib/observability";
import { streamToObservable } from "@/lib/stream-to-observable";
import { assert, formatDisplayName, sentenceToSlug } from "@/lib/utils";
import { DbOrTransaction } from "@/types";
import { createClient, sql } from "@vercel/postgres";
import { and, eq, sql as sqlFN } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { from, switchMap } from "rxjs";
import { fromEventObservable, fromPromise } from "xstate";
import {
  SuggestChefNamesOutputSchema,
  SuggestChefNamesStream,
} from "../app/suggest-chef-names-stream";
import {
  SuggestListNamesOutputSchema,
  SuggestListNamesStream,
} from "../app/suggest-list-names-stream";

const ensureListWithNameExists = async (
  dbOrTransaction: DbOrTransaction,
  userId: string,
  name: string
) => {
  const slug = sentenceToSlug(name);
  const db = drizzle(sql);
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
    result = await queryRunner
      .insert(ListTable)
      .values({
        slug: slug,
        name: formatDisplayName(slug),
        createdBy: userId,
        createdAt: sqlFN`NOW()`, // Automatically set the creation time to now
      })
      .returning({ id: ListTable.id });

    item = result[0];

    if (!item) {
      console.error(result);
      return {
        success: false,
        error: "was not able to insert list",
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
  const db = drizzle(sql);
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
          addedAt: sqlFN`NOW()`, // Automatically set the added time to now
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

export const getUserPreferences = fromPromise(
  async ({
    input,
  }: {
    input: {
      userId: string;
    };
  }) => {
    const client = createClient();
    await client.connect();
    const db = drizzle(client);
    try {
      const result = await db
        .select()
        .from(UserPreferencesTable)
        .where(eq(UserPreferencesTable.userId, input.userId))
        .execute();
      return result;
    } finally {
      await client.end();
    }
  }
);
