import { PageSessionSnapshot } from "@/app/page-session-machine";
import { createSelector } from "reselect";

export const selectCurrentListRecipeIds = (state: PageSessionSnapshot) => {
  return state.context.sessionSnapshot?.context.selectedRecipeIds || [];
};

export const selectUserEmail = (state: PageSessionSnapshot) =>
  state.context.userSnapshot?.context.email;

export const selectSelectedRecipeCount = (state: PageSessionSnapshot) =>
  state.context.sessionSnapshot?.context.selectedRecipeIds?.length || 0;

export const selectFeedItemIds = (state: PageSessionSnapshot) =>
  state.context.sessionSnapshot?.context.feedItemIds || [];

export const selectNumFeedItemIds = createSelector(
  selectFeedItemIds,
  (items) => items.length
);

export const selectProfileName = (state: PageSessionSnapshot) => {
  return state.context.userSnapshot?.context.profileName;
};

export const selectSuggestedProfileNames = (state: PageSessionSnapshot) => {
  return state.context.userSnapshot?.context.suggestedProfileNames || [];
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
      state.context.sessionSnapshot?.context.selectedRecipeIds[index] || -1
    ];
  };
};

export const createFeedItemAtIndexSelector =
  (index: number) => (state: PageSessionSnapshot) => {
    const id = state.context.sessionSnapshot?.context.feedItemIds[index];
    if (id) {
      return state.context.sessionSnapshot?.context.feedItemsById[id];
    }
    return undefined;
  };

export const createFeedItemRecipeAtIndexSelector =
  (input: { recipeIndex: number; itemIndex: number }) =>
  (state: PageSessionSnapshot) => {
    const id =
      state.context.sessionSnapshot?.context.feedItemIds[input.itemIndex];
    if (id) {
      const item = state.context.sessionSnapshot?.context.feedItemsById[id];
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
    const listsById = state.context.sessionSnapshot?.context.listsById;
    if (!listsById) {
      return undefined;
    }

    const favoriteList = Object.values(listsById).find(({ slug }) => {
      return slug === "favorites";
    });

    if (!favoriteList) {
      return undefined;
    }

    return favoriteList.idSet[id];
  };

export const createRecipeIsSelectedSelector =
  (id?: string) => (state: PageSessionSnapshot) => {
    if (!id) {
      return false;
    }
    return state.context.sessionSnapshot?.context.selectedRecipeIds.includes(
      id
    );
  };

export const selectSuggestedFeedTopics = (state: PageSessionSnapshot) => {
  return state.context.userSnapshot?.context.suggestedFeedTopics;
};

export const selectSelectedFeedTopics = (state: PageSessionSnapshot) => {
  return state.context.userSnapshot?.context.selectedFeedTopics;
};
