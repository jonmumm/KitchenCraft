"use client";

import { ReactNode, createContext } from "react";

type Props = {
  slug: string;
  upvote: () => Promise<
    ({ success: true } | { success: false; error: string }) | never
  >;
};

export const RecipeContext = createContext({} as Props);

export const RecipePropsProvider = ({
  children,
  ...props
}: Props & {
  children: ReactNode;
}) => {
  return (
    <RecipeContext.Provider value={{ ...props }}>
      {children}
    </RecipeContext.Provider>
  );
};
