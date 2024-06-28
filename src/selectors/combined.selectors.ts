// Used for selectors where we need to combine client and server state

import { AppSnapshot } from "@/app/app-machine";
import { PageSessionSnapshot } from "@/app/page-session-machine";
import { createSelector } from "reselect";
import { selectCurrentListSlug, } from "./app.selectors";
import { createListRecipeIdsByIdSelector, createListRecipeIdsBySlugSelector } from "./page-session.selectors";

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

// export const createIsFocusedRecipeInListByIdSelector = (id?: string) =>
//   createSelector(
//     [
//       selectFocusedRecipeId,
//       (_, pageSessionSnapshot: PageSessionSnapshot) => pageSessionSnapshot,
//     ],
//     (focusedRecipeId, pageSessionSnapshot) => {
//       if (!focusedRecipeId || !id) {
//         return false;
//       }
//       const listRecipeIds =
//         createListRecipeIdsByIdSelector(id)(pageSessionSnapshot);
//       return listRecipeIds
//         ? Object.keys(listRecipeIds).includes(focusedRecipeId)
//         : false;
//     }
//   );

// export const createIsFocusedRecipeInListBySlugSelector = (slug?: string) =>
//   createSelector(
//     [
//       selectFocusedRecipeId,
//       (_, pageSessionSnapshot: PageSessionSnapshot) => pageSessionSnapshot,
//     ],
//     (focusedRecipeId, pageSessionSnapshot) => {
//       if (!focusedRecipeId || !slug) {
//         return false;
//       }
//       const listRecipeIds =
//         createListRecipeIdsBySlugSelector(slug)(pageSessionSnapshot);
//       return listRecipeIds
//         ? Object.keys(listRecipeIds).includes(focusedRecipeId)
//         : false;
//     }
//   );

// export const selectIsFocusedRecipeInCurrentList = (
//   appSnapshot: AppSnapshot,
//   { context }: PageSessionSnapshot
// ) => {
//   const prompt = appSnapshot.context.submittedPrompt;
//   const resultId = context.resultIdsByPrompt[prompt];
//   if (!resultId) {
//     return 0;
//   }

//   return context.results[resultId]?.suggestedRecipes.length || 0;
// };

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

// todo refactor this to be faster, use individual selectors
export const selectCurrentListItems = (
  appSnapshot: AppSnapshot,
  pageSessionSnapshot: PageSessionSnapshot
) => {
  const currentListSlug = selectCurrentListSlug(appSnapshot);
  return createListRecipeIdsBySlugSelector(currentListSlug)(
    pageSessionSnapshot
  );
};

export const selectCurrentListCount = createSelector(
  selectCurrentListItems,
  (items) => {
    return items ? Object.keys(items).length : 0;
  }
);

// export const selectCurrentListCount = (
//   appSnapshot: AppSnapshot,
//   pageSessionSnapshot: PageSessionSnapshot
// ) => {
//   const currentListSlug = selectCurrentListSlug(appSnapshot);
//   const selectedRecipeCount = selectSelectedRecipeCount(pageSessionSnapshot);
//   const list = createListBySlugSelector(currentListSlug)(pageSessionSnapshot);

//   if (currentListSlug === "selected") {
//     return selectedRecipeCount;
//   } else {
//     return list?.count;
//   }
// };

export const selectHasRecipesInCurrentList = createSelector(
  selectCurrentListCount,
  (count) => (count ? count > 0 : false)
);
