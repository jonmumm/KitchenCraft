import { PageSessionSnapshot } from "@/app/page-session-machine";
import { createSelector } from "reselect";

export const selectCurrentListRecipeIds = (state: PageSessionSnapshot) => {
  return state.context.browserSessionSnapshot?.context.selectedRecipeIds || [];
};

export const selectSelectedRecipeCount = (state: PageSessionSnapshot) =>
  state.context.browserSessionSnapshot?.context.selectedRecipeIds?.length || 0;

export const selectFeedItemIds = (state: PageSessionSnapshot) =>
  state.context.browserSessionSnapshot?.context.feedItemIds || [];

export const selectNumFeedItemIds = createSelector(
  selectFeedItemIds,
  (items) => items.length
);

export const selectProfileName = (state: PageSessionSnapshot) => {
  return state.context.browserSessionSnapshot?.context.profileName;
};

export const selectSuggestedProfileNames = (state: PageSessionSnapshot) => {
  return (
    state.context.browserSessionSnapshot?.context.suggestedProfileNames || []
  );
};

export const createRecipeSelector =
  (id?: string) => (state: PageSessionSnapshot) => {
    if (id) {
      return state.context.recipes[id];
    }
    return undefined;
  };

export const createSelectedRecipeAtIndexSelector = (index: number) => {
  return (state: PageSessionSnapshot) => {
    return state.context.recipes?.[
      state.context.browserSessionSnapshot?.context.selectedRecipeIds[index] ||
        -1
    ];
  };
};

export const createFeedItemAtIndexSelector =
  (index: number) => (state: PageSessionSnapshot) => {
    const id = state.context.browserSessionSnapshot?.context.feedItemIds[index];
    if (id) {
      return state.context.browserSessionSnapshot?.context.feedItemsById[id];
    }
    return undefined;
  };

export const createFeedItemRecipeAtIndexSelector =
  (input: { recipeIndex: number; itemIndex: number }) =>
  (state: PageSessionSnapshot) => {
    const id =
      state.context.browserSessionSnapshot?.context.feedItemIds[
        input.itemIndex
      ];
    if (id) {
      const item = state.context.browserSessionSnapshot?.context.feedItemsById[id];
      return item?.recipes?.[input.recipeIndex];
    }
    return undefined;
  };

export const createRecipeIsFavoritedSelector =
  (id?: string) => (state: PageSessionSnapshot) => {
    if (!id) {
      return undefined;
    }
    // todo find the
    const listsById = state.context.browserSessionSnapshot?.context.listsById;
    if (!listsById) {
      return undefined;
    }

    const favoriteList = Object.values(listsById).find(({ slug }) => {
      return slug === "favorites";
    });

    if (!favoriteList) {
      return undefined;
    }

    return favoriteList.items.idSet[id];
  };

export const createRecipeIsSelectedSelector =
  (id?: string) => (state: PageSessionSnapshot) => {
    if (!id) {
      return false;
    }
    return state.context.browserSessionSnapshot?.context.selectedRecipeIds.includes(
      id
    );
  };

export const selectSuggestedFeedTopics = (state: PageSessionSnapshot) => {
  return state.context.browserSessionSnapshot?.context.suggestedFeedTopics;
};

export const selectSelectedFeedTopics = (state: PageSessionSnapshot) => {
  return state.context.browserSessionSnapshot?.context.selectedFeedTopics;
};
