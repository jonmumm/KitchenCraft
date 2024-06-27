import { createListBySlugSelector } from "@/selectors/page-session.selectors";
import { useMemo } from "react";
import { usePageSessionSelector } from "./usePageSessionSelector";

export const useRecipeListBySlug = (slug: string) => {
  const selectList = useMemo(() => createListBySlugSelector(slug), [slug]);
  const list = usePageSessionSelector(selectList);
  return list;
};
