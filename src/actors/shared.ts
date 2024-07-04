import { UserPreferencesTable } from "@/db";
import { streamToObservable } from "@/lib/stream-to-observable";
import { createClient } from "@vercel/postgres";
import { eq } from "drizzle-orm";
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
