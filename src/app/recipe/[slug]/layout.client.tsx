"use client";

import { ReactNode } from "react";
import { RecipeContext } from "./context";

export const LayoutClient = ({ children }: { children: ReactNode }) => {
  return (
    <RecipeContext.Provider
      value={{
        upvote: async () => {
          "use server";
          console.log("upvote!");
        },
        slug: "",
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};
