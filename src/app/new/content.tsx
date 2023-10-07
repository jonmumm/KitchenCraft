"use client";

import { RecipeChat } from "@/components/recipe-chat";

export const Content = () => {
  return (
    <div className={`flex flex-col flex-end flex-1 mt-24 overflow-hidden`}>
      <RecipeChat />
    </div>
  );
};
