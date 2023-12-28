import { Toaster } from "@/components/feedback/toaster";
import { IOSStartupImages } from "@/components/meta/ios-startup-images";
import { ThemeProvider } from "@/components/theme-provider";
import { getSession } from "@/lib/auth/session";
import { getResult } from "@/lib/db";
import { getSlug } from "@/lib/slug";
import { TokenParser } from "@/lib/token-parser";
import { assert } from "@/lib/utils";
import {
  InstantRecipeMetadataPredictionOutputSchema,
  SuggestionPredictionOutputSchema,
} from "@/schema";
import { kv } from "@/lib/kv";
import { nanoid } from "ai";
import type { Metadata } from "next";
import { ReactNode } from "react";
import "../styles/globals.css";
import { Body } from "./components.client";
import { ApplicationProvider } from "./provider";
import { createRecipe } from "./recipe/lib";
import "./styles.css";

export const metadata: Metadata = {
  title: "KitchenCraft",
  description: "Make something different",
};

export default async function RootLayout({
  children,
  craft,
  remix,
  footer,
  header,
}: {
  children: ReactNode;
  craft: ReactNode;
  remix: ReactNode;
  footer: ReactNode;
  header: ReactNode;
}) {
  const actions = {
    createNewInstantRecipe,
    createNewRecipeFromSuggestion,
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <IOSStartupImages />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        {/* // todo only do this if react node loaded */}
      </head>
      <ApplicationProvider session={await getSession()} actions={actions}>
        <Body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div>{header}</div>
            <div className="crafting:hidden">{children}</div>
            <div className="hidden crafting:block">{craft}</div>
            {footer}

            {/* Sheets/Dialogs */}
            {/* {craft} */}
            {remix}
          </ThemeProvider>
          <Toaster />
        </Body>
      </ApplicationProvider>
    </html>
  );
}

async function createNewInstantRecipe(
  prompt: string,
  instantRecipeResultId: string
) {
  "use server";
  const resultKey = `instant-recipe:${instantRecipeResultId}`;

  // todo but unlikely possible that its not done yet, output might not be here...
  // todo add wait up to 10s
  const output = await kv.hget(resultKey, "output");
  const { name, description } =
    InstantRecipeMetadataPredictionOutputSchema.parse(output);

  // const

  const id = nanoid();
  const slug = getSlug({ id, name });
  await createRecipe({
    slug,
    name,
    description,
    createdAt: new Date().toISOString(),
    fromPrompt: prompt,
    runStatus: "initializing",
    previewMediaIds: [],
    mediaCount: 0,
  });
  return { success: true, data: { recipeUrl: `/recipe/${slug}` } };
}

async function createNewRecipeFromSuggestion(
  suggestionsResultId: string,
  index: number
) {
  "use server";
  const result = await getResult(kv, suggestionsResultId);
  const parser = new TokenParser(SuggestionPredictionOutputSchema);
  // const output = parser.parsePartial(result.outputRaw);

  // const parser = new TokenParser(schema);
  const output = parser.parsePartial(result.outputRaw);
  if (!output?.suggestions) {
    return { success: false as const, error: "Suggestions not found" };
  }

  const item = output.suggestions[index];
  assert(item, "expected item");
  const { name, description } = item;
  if (!name || !description) {
    return { success: false as const, error: "Missing name or description" };
  }

  const id = nanoid();
  const slug = getSlug({ id, name });
  await createRecipe({
    slug,
    name,
    description,
    createdAt: new Date().toISOString(),
    fromResult: {
      resultId: suggestionsResultId,
      index,
    },
    runStatus: "initializing",
    previewMediaIds: [],
    mediaCount: 0,
  });
  return { success: true as const, data: { recipeUrl: `/recipe/${slug}` } };
}

export type CreateNewInstantRecipe = typeof createNewInstantRecipe;
export type CreateNewRecipeFromSuggestion =
  typeof createNewRecipeFromSuggestion;
