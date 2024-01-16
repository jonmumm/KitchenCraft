import { IOSStartupImages } from "@/components/meta/ios-startup-images";
import { SafariInstallPrompt } from "@/modules/pwa-install/safari-install-prompt";
import { ThemeProvider } from "@/components/theme-provider";
import { RecipesTable, db } from "@/db";
import { NewRecipe } from "@/db/types";
import { getCurrentEmail, getDistinctId, getSession } from "@/lib/auth/session";
import { createAppInstallToken } from "@/lib/browser-session";
import { parseCookie } from "@/lib/coookieStore";
import { getResult } from "@/lib/db";
import { getErrorMessage } from "@/lib/error";
import { getCanInstallPWA } from "@/lib/headers";
import { kv } from "@/lib/kv";
import { getSlug } from "@/lib/slug";
import { TokenParser } from "@/lib/token-parser";
import { assert, noop } from "@/lib/utils";
import {
  InstantRecipeMetadataPredictionOutputSchema,
  RecipePredictionOutputSchema,
  SuggestionPredictionInputSchema,
  SuggestionPredictionOutputSchema,
} from "@/schema";
import { RecipeBase, RecipePredictionInput } from "@/types";
import { nanoid } from "ai";
import { randomUUID } from "crypto";
import type { Metadata } from "next";
import { revalidateTag } from "next/cache";
import { ReactNode } from "react";
import "../styles/globals.css";
import { Body, SearchParamsToastMessage } from "./components.client";
import { ApplicationProvider } from "./provider";
import { RecipeTokenStream } from "./recipe/[slug]/stream";
import "./styles.css";
import { Toaster } from "@/components/feedback/sonner";
import { Toaster as LegacyToaster } from "@/components/feedback/toaster";

const APP_NAME = "KitchenCraft";
const APP_DEFAULT_TITLE = "kitchencraft.ai";
const APP_TITLE_TEMPLATE = "%s | KitchenCraft";
const APP_DESCRIPTION = "Create unique recipes, instantly.";

export const metadata: Metadata = {
  title: "KitchenCraft",
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export default async function RootLayout({
  children,
  craft,
  footer,
  header,
}: {
  children: ReactNode;
  craft: ReactNode;
  footer: ReactNode;
  header: ReactNode;
}) {
  async function createNewInstantRecipe(
    prompt: string,
    instantRecipeResultId: string
  ) {
    "use server";
    const resultKey = `instant-recipe:${instantRecipeResultId}`;

    // todo but unlikely possible that its not done yet, output might not be here...
    // todo add wait up to 10s
    const output = await kv.hget(resultKey, "output"); // Fetching promise
    const { name, description } =
      InstantRecipeMetadataPredictionOutputSchema.parse(output);
    if (!name || !description) {
      return { success: false as const, error: "Missing name or description" };
    }

    const id = nanoid();
    const slug = getSlug({ id, name });

    const createdBy = await getDistinctId();
    const createdAt = new Date();
    const recipeKey = `recipe:${slug}`;
    const input = {
      recipe: {
        name,
        description,
      },
      prompt,
    } satisfies RecipePredictionInput;

    await kv.hset(recipeKey, {
      runStatus: "started",
      input,
      outputRaw: "",
    });

    (async () => {
      const recipeTokenStream = new RecipeTokenStream({
        cacheKey: `recipe:${slug}`,
      });
      const stream = await recipeTokenStream.getStream(input);
      const parser = new TokenParser(RecipePredictionOutputSchema);
      const charArray: string[] = [];

      for await (const chunk of stream) {
        for (const char of chunk) {
          charArray.push(char);
        }
      }

      const outputRaw = charArray.join("");

      try {
        const output = parser.parse(outputRaw);

        const finalRecipe = {
          id: randomUUID(),
          slug,
          versionId: 0,
          description,
          name,
          yield: output.recipe.yield,
          tags: output.recipe.tags,
          ingredients: output.recipe.ingredients,
          instructions: output.recipe.instructions,
          cookTime: output.recipe.cookTime,
          activeTime: output.recipe.activeTime,
          totalTime: output.recipe.totalTime,
          prompt: input.prompt!,
          createdBy,
          createdAt,
        } satisfies NewRecipe;

        db.insert(RecipesTable)
          .values(finalRecipe)
          .then(() => {
            revalidateTag(`recipe:${slug}`);
            kv.hset(recipeKey, {
              runStatus: "done",
              outputRaw,
              output,
            }).then(noop);
          });
      } catch (ex) {
        // Parsing error...
        await kv.hset(recipeKey, {
          status: "error",
          error: getErrorMessage(ex),
          outputRaw,
        });
        // subject.error(ex);
      }
    })();

    await kv.hset(`recipe:${slug}`, {
      slug,
      name,
      description,
      runStatus: "initializing",
    } satisfies RecipeBase);

    return { success: true as const, data: { recipeUrl: `/recipe/${slug}` } };
  }

  async function createNewRecipeFromSuggestion(
    suggestionsResultId: string,
    index: number
  ) {
    "use server";
    const suggestionsResult = await getResult(kv, suggestionsResultId);
    const { prompt } = SuggestionPredictionInputSchema.parse(
      suggestionsResult.input
    );
    assert(prompt, "expected prompt");

    const suggestionsParser = new TokenParser(SuggestionPredictionOutputSchema);
    const output = suggestionsParser.parsePartial(suggestionsResult.outputRaw);
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
    const createdBy = await getDistinctId();
    const createdAt = new Date();

    const input = {
      recipe: {
        name,
        description,
      },
      prompt,
    } satisfies RecipePredictionInput;

    const recipeKey = `recipe:${slug}`;
    await kv.hset(recipeKey, {
      runStatus: "started",
      input,
      outputRaw: "",
    });

    (async () => {
      const recipeTokenStream = new RecipeTokenStream({
        cacheKey: `recipe:${slug}`,
      });
      const stream = await recipeTokenStream.getStream(input);
      const parser = new TokenParser(RecipePredictionOutputSchema);
      const charArray: string[] = [];

      for await (const chunk of stream) {
        for (const char of chunk) {
          charArray.push(char);
        }
      }

      const outputRaw = charArray.join("");

      try {
        const output = parser.parse(outputRaw);

        const finalRecipe = {
          id: randomUUID(),
          slug,
          versionId: 0,
          description,
          name,
          yield: output.recipe.yield,
          tags: output.recipe.tags,
          ingredients: output.recipe.ingredients,
          instructions: output.recipe.instructions,
          cookTime: output.recipe.cookTime,
          activeTime: output.recipe.activeTime,
          totalTime: output.recipe.totalTime,
          prompt: input.prompt!,
          createdBy,
          createdAt,
        } satisfies NewRecipe;

        db.insert(RecipesTable)
          .values(finalRecipe)
          .then(() => {
            revalidateTag(`recipe:${slug}`);
            kv.hset(recipeKey, {
              runStatus: "done",
              outputRaw,
              output,
            }).then(noop);
          });
      } catch (ex) {
        // Parsing error...
        await kv.hset(recipeKey, {
          status: "error",
          error: getErrorMessage(ex),
          outputRaw,
        });
        // subject.error(ex);
      }
    })();

    await kv.hset(`recipe:${slug}`, {
      slug,
      name,
      description,
      runStatus: "initializing",
    } satisfies RecipeBase);

    return { success: true as const, data: { recipeUrl: `/recipe/${slug}` } };
  }

  const currentEmail = await getCurrentEmail();
  const appInstallToken = await createAppInstallToken(
    await getDistinctId(),
    currentEmail
  );

  let manifestHref = `/user-app-manifest.json`;
  if (appInstallToken) {
    manifestHref += `?token=${appInstallToken}`;
  }

  const actions = {
    createNewInstantRecipe,
    createNewRecipeFromSuggestion,
  };

  const canInstallPWA = getCanInstallPWA();

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
        <link rel="manifest" href={manifestHref} />
        <IOSStartupImages />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        {/* // todo only do this if react node loaded */}
      </head>
      <ApplicationProvider
        session={await getSession()}
        actions={actions}
        appSessionId={parseCookie("appSessionId")}
      >
        <Body isPWA={!!parseCookie("appSessionId")}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="min-h-[95dvh]">
              <div>{header}</div>
              <div className="crafting:hidden">{children}</div>
              <div className="hidden crafting:block">{craft}</div>
            </div>
            <div className="sticky mt-4 bottom-0 z-50">{footer}</div>
            {canInstallPWA && <SafariInstallPrompt />}
          </ThemeProvider>
          <Toaster />
          <SearchParamsToastMessage />
          <LegacyToaster />
          {/* <KeyboardAvoidingView>
            {footer}
          </KeyboardAvoidingView> */}
          {/* <Badge>Back</Badge> */}
        </Body>
      </ApplicationProvider>
    </html>
  );
}

// export type CreateNewInstantRecipe = typeof createNewInstantRecipe;
// export type CreateNewRecipeFromSuggestion =
//   typeof createNewRecipeFromSuggestion;
