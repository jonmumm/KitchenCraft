"use client";

import { ReactNode } from "react";
import { RecipeContext } from "./context";

export const LayoutClient = ({ children }: { children: ReactNode }) => {
  return (
    <RecipeContext.Provider
      value={{
        slug: "",
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};
