import { createListByIdSelector } from "@/selectors/page-session.selectors";
import { useMemo } from "react";
import { usePageSessionSelector } from "./usePageSessionSelector";

export const useRecipeListById = (id: string) => {
  const selectList = useMemo(() => createListByIdSelector(id), [id]);
  return usePageSessionSelector(selectList);
};
