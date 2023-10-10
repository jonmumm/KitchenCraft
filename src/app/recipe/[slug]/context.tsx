"use client";

import { RecipeSlug } from "@/types";
import { ReactNode, createContext, useContext } from "react";

export const RecipePageContext = createContext({
  slug: "" as string,
});

export const RecipePageProvider = ({
  slug,
  children,
}: {
  slug: RecipeSlug;
  children: ReactNode;
}) => {
  return (
    <RecipePageContext.Provider value={{ slug }}>
      {children}
    </RecipePageContext.Provider>
  );
};