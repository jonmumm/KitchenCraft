import { QueryStoreState } from "@/lib/query";
import { MapStore } from "nanostores";

export const getSlugSelector =
  (index: number) =>
  <T extends { slug: string }[]>(
    state: ReturnType<MapStore<QueryStoreState<T>>["get"]>
  ) => {
    return state.loading ? null : state.data[index]?.slug;
  };

export const getMediaIdSelector =
  (index: number, mediaIndex: number) =>
  <T extends { previewMediaIds: string[] }[]>(
    state: ReturnType<MapStore<QueryStoreState<T>>["get"]>
  ) => {
    const recipe = state.data[index];
    if (recipe?.previewMediaIds.length) {
      return recipe.previewMediaIds[mediaIndex] || null;
    }

    if (!state.loading) return null;
  };
