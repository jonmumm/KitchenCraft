// Used for selectors where we need to combine client and server state

import { AppSnapshot } from "@/app/app-machine";
import { PageSessionSnapshot } from "@/app/page-session-machine";

export const createSuggestedRecipeAtIndexSelector =
  (index: number) =>
  (appSnapshot: AppSnapshot, { context }: PageSessionSnapshot) => {
    const prompt = appSnapshot.context.submittedPrompt;
    const resultId = context.resultIdsByPrompt[prompt];
    if (!resultId) {
      return undefined;
    }

    const recipeId = context.results[resultId]?.suggestedRecipes[index];
    if (!recipeId) {
      return undefined;
    }

    return context.recipes[recipeId];
  };

export const selectNumSuggestedRecipes = (
  appSnapshot: AppSnapshot,
  { context }: PageSessionSnapshot
) => {
  const prompt = appSnapshot.context.submittedPrompt;
  const resultId = context.resultIdsByPrompt[prompt];
  if (!resultId) {
    return 0;
  }

  return context.results[resultId]?.suggestedRecipes.length || 0;
};

export const selectHasRecipesGenerated = (
  appSnapshot: AppSnapshot,
  pageSessionSnapshot: PageSessionSnapshot
) => {
  const num = selectNumSuggestedRecipes(appSnapshot, pageSessionSnapshot);
  return num > 0;
};

export const createSuggestedTokenAtIndexSelector =
  (index: number) =>
  (appSnapshot: AppSnapshot, { context }: PageSessionSnapshot) => {
    const resultId =
      context.resultIdsByPrompt[appSnapshot.context.submittedPrompt];
    if (!resultId) {
      return undefined;
    }

    return context.results[resultId]?.suggestedTokens[index];
  };