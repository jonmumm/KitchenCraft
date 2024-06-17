import { PageSessionSnapshot } from "@/app/page-session-machine";
import { createSelector } from "reselect";

// this is a poc to be able to select a child actor in a typesafe way
// const selectSessionActor = (state: PageSessionSnapshot) => {
//   return state.children[SESSION_ACTOR_ID];
// };
// const selectUserActor = (state: PageSessionSnapshot) => {
//   return state.children[USER_ACTOR_ID];
// };

export const selectSelectedRecipeIds = (state: PageSessionSnapshot) => {
  return state.context.sessionSnapshot?.context.selectedRecipeIds || [];
};

export const selectPromptIsDirty = (state: PageSessionSnapshot) =>
  state.context.prompt.length === 0;

export const selectPromptIsPristine = (state: PageSessionSnapshot) =>
  state.context.prompt.length > 0;

export const selectUserEmail = (state: PageSessionSnapshot) =>
  state.context.sessionSnapshot?.context.email;

export const selectSelectedRecipeCount = (state: PageSessionSnapshot) =>
  state.context.sessionSnapshot?.context.selectedRecipeIds?.length || 0;

export const selectFeedItemIds = (state: PageSessionSnapshot) =>
  state.context.sessionSnapshot?.context.feedItemIds || [];

export const selectNumFeedItemIds = createSelector(
  selectFeedItemIds,
  (items) => items.length
);

export const selectHasRecipesSelected = createSelector(
  selectSelectedRecipeCount,
  (count) => {
    return count > 0;
  }
);

export const selectUserId = (state: PageSessionSnapshot) => {
  return state.context.userSnapshot?.context.id!; // same to assume always there
};

export const selectProfileName = (state: PageSessionSnapshot) => {
  return state.context.userSnapshot?.context.profileName;
};

export const selectSuggestedProfileNames = (state: PageSessionSnapshot) => {
  return state.context.userSnapshot?.context.suggestedProfileNames || [];
};

export const createUrlForListIdSelector =
  (listId?: string) => (state: PageSessionSnapshot) => {
    if (!listId) {
      return undefined;
    }

    const listsById = state.context.userSnapshot?.context.listsById;
    if (!listsById) {
      return undefined;
    }

    const list = listsById[listId];
    if (!list) {
      return undefined;
    }

    const profileName = selectProfileName(state);
    const userId = selectUserId(state);

    if (profileName && list.slug) {
      return `/@${profileName}/${list.slug}`;
    }

    if (list.slug) {
      return `/user/${userId}/${list.slug}`;
    }

    return `/list/${listId}`;
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

export const selectSuggestedIngredients = (snapshot: PageSessionSnapshot) => {
  return snapshot.context.sessionSnapshot?.context.suggestedIngredients || [];
};

export const createListByIdSelector =
  (id?: string) => (state: PageSessionSnapshot) => {
    const listsById = state.context.userSnapshot?.context.listsById;
    if (!listsById) {
      return undefined;
    }
    if (!id) {
      return undefined;
    }
    return listsById[id];
  };

export const createListBySlugSelector =
  (slug: string) => (state: PageSessionSnapshot) => {
    const listsById = state.context.userSnapshot?.context.listsById;
    if (!listsById) {
      return undefined;
    }
    return Object.values(listsById).find((list) => list.slug === slug);
  };

export const selectRecentListIds = (state: PageSessionSnapshot) => {
  return state.context.userSnapshot?.context?.recentListIds ?? [];
};
