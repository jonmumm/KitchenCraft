import { PageSessionSnapshot } from "@/app/page-session-machine";
import { sentenceToSlug } from "@/lib/utils";
import { createSelector } from "reselect";

// this is a poc to be able to select a child actor in a typesafe way
// const selectSessionActor = (state: PageSessionSnapshot) => {
//   return state.children[SESSION_ACTOR_ID];
// };
// const selectUserActor = (state: PageSessionSnapshot) => {
//   return state.children[USER_ACTOR_ID];
// };

export const selectPageSessionState = (state: PageSessionSnapshot) => {
  return state;
};

export const selectPageSessionContext = createSelector(
  selectPageSessionState,
  ({ context }) => context
);

export const selectRecipes = createSelector(
  selectPageSessionContext,
  (context) => context.recipes
);

export const selectChoosingListsForRecipeId = createSelector(
  selectPageSessionContext,
  ({ choosingListsForRecipeId }) => choosingListsForRecipeId
);

export const selectSessionSnapshot = createSelector(
  selectPageSessionContext,
  ({ sessionSnapshot }) => sessionSnapshot
);
export const selectSessionContext = createSelector(
  selectSessionSnapshot,
  (snapshot) => snapshot?.context
);
export const selectSessionState = createSelector(
  selectSessionSnapshot,
  (snapshot) => snapshot?.value
);
export const selectUserSnapshot = createSelector(
  selectPageSessionContext,
  ({ userSnapshot }) => userSnapshot
);
export const selectUserContext = createSelector(
  selectUserSnapshot,
  (snapshot) => snapshot?.context
);
export const selectUserState = createSelector(
  selectUserSnapshot,
  (snapshot) => snapshot?.value
);

export const selectSelectedRecipeIds = (state: PageSessionSnapshot) => {
  return state.context.sessionSnapshot?.context.selectedRecipeIds;
};

export const selectPromptIsDirty = (state: PageSessionSnapshot) =>
  state.context.prompt.length === 0;

export const selectPromptIsPristine = (state: PageSessionSnapshot) =>
  state.context.prompt.length > 0;

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

export const createPathForListIdSelector =
  (listId?: string) => (state: PageSessionSnapshot) => {
    if (!listId) {
      return undefined;
    }

    const listsById = state.context.listsById;
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

export const createRecipeSelector = (id?: string) =>
  createSelector(selectRecipes, (recipes) => (id ? recipes[id] : undefined));

export const createRecipeLinkSelector = (id?: string) =>
  createSelector(createRecipeSelector(id), (recipe) => {
    return recipe?.slug ? `/recipe/${recipe.slug}` : undefined;
  });
// createSelector(selectRecipes, (recipes) => (id ? recipes[id] : undefined));

export const createSelectedRecipeAtIndexSelector = (index: number) => {
  return (state: PageSessionSnapshot) => {
    return state.context.recipes?.[
      state.context.sessionSnapshot?.context.selectedRecipeIds?.[index] || -1
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

export const createListRecipeIdsBySlugSelector = (slug: string | undefined) =>
  createSelector(
    createListBySlugSelector(slug),
    selectListRecipes,
    (list, listRecipes) => {
      return list ? listRecipes[list.id] : undefined;
    }
  );

export const createListBySlugSelector =
  (slug: string | undefined) => (state: PageSessionSnapshot) => {
    const listsById = state.context.listsById;
    if (!listsById) {
      return undefined;
    }
    if (!slug) {
      return undefined;
    }
    return Object.values(listsById).find((list) => list.slug === slug);
  };

const selectLikedList = createListBySlugSelector("liked");

const selectLikedListId = createSelector(
  selectLikedList,
  (likedList) => likedList?.id
);

const selectListRecipes = createSelector(
  selectPageSessionContext,
  ({ listRecipes }) => listRecipes
);

export const createRecipeIsSavedInListSelector = (id?: string) =>
  createSelector(
    (state: PageSessionSnapshot) => state.context.listRecipes,
    (state: PageSessionSnapshot) => state.context.listsById,
    (listRecipes, listsById) => {
      if (!id || !listsById || !listRecipes) {
        return false;
      }

      // Check if the recipe is in any list
      return Object.keys(listsById).some((listId) => {
        const recipesInList = listRecipes[listId];
        return !!recipesInList && !!recipesInList[id];
      });
    }
  );

export const createRecipeIsLikedSelector = (id?: string) =>
  createSelector(
    selectLikedListId,
    selectListRecipes,
    (likedListId, listRecipes) =>
      id && likedListId ? !!listRecipes[likedListId]?.[id] : false
  );

export const createRecipeIsFavoritedSelector =
  (id?: string) => (state: PageSessionSnapshot) => {
    if (!id) {
      return undefined;
    }
    // todo find the
    const listsById = state.context.listsById;
    if (!listsById) {
      return undefined;
    }

    const favoriteList = Object.values(listsById).find(({ slug }) => {
      return slug === "favorites";
    });

    if (!favoriteList) {
      return undefined;
    }

    return !!state.context.listRecipes[favoriteList.id]?.[id];
  };

// export const createRecipeIsLikedSelector =
//   (id?: string) => (state: PageSessionSnapshot) => {
//     if (!id) {
//       return false;
//     }
//     return state.context.sessionSnapshot?.context.selectedRecipeIds?.includes(
//       id
//     );
//   };

export const createRecipeIsSelectedSelector =
  (id?: string) => (state: PageSessionSnapshot) => {
    if (!id) {
      return false;
    }
    return state.context.sessionSnapshot?.context.selectedRecipeIds?.includes(
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
    const listsById = state.context.listsById;
    if (!listsById) {
      return undefined;
    }
    if (!id) {
      return undefined;
    }
    return listsById[id];
  };

export const selectRecentCreatedListIds = (state: PageSessionSnapshot) => {
  return state.context.userSnapshot?.context.recentCreatedListIds;
};

export const selectRecentSharedListIds = (state: PageSessionSnapshot) => {
  return state.context.userSnapshot?.context.recentSharedListIds;
};

export const selectSharingList = (state: PageSessionSnapshot) => {
  if (state.context.sharingListId) {
    return state.context.listsById?.[state.context.sharingListId];
  }
  return undefined;
};

export const selectSharingListIsCreated = ({
  context,
}: PageSessionSnapshot) => {
  return context.sharingListId
    ? !!context.listsById?.[context.sharingListId]
    : undefined;
};

export const selectSharingListPath = (state: PageSessionSnapshot) => {
  const profileName = selectProfileName(state);
  const userId = selectUserId(state);
  const shareName = selectShareNameInput(state);
  const slug = sentenceToSlug(shareName || "");

  if (profileName) {
    return `/@${profileName}/${slug}`;
  }

  return `/user/${userId}/${slug}`;
};

export const selectShareNameInput = (state: PageSessionSnapshot) =>
  state.context.shareNameInput;

export const createListRecipeIdsByIdSelector = (listId?: string) =>
  createSelector(selectListRecipes, (listRecipes) =>
    listId ? listRecipes[listId] : undefined
  );

export const createIsChoosingRecipeInListByIdSelector = (id?: string) =>
  createSelector(
    selectChoosingListsForRecipeId,
    selectListRecipes,
    (recipeId, listRecipes) => {
      const inList = !!id && !!recipeId && !!listRecipes[id]?.[recipeId];
      return !!inList;
    }
  );

// export const createIsChoosingRecipeInListBySlugSelector = (slug?: string) =>
//   createSelector(
//     selectChoosingListsForRecipeId,
//     createListBySlugSelector(slug),
//     selectListRecipes,
//     (recipeId, list, listRecipes) => {
//       return list ? !!listRecipes[list.id][recipeId] : false;
//     }
//   );

// export const createIsChoosingRecipeInListBySlugSelector = (slug?: string) =>
//   createSelector(
//     selectChoosingListsForRecipeId
//     (recipeId, pageSessionSnapshot) => {
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
