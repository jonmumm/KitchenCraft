"use client";

import { RecipeChat } from "@/components/recipe-chat";

export const Content = () => {
  return (
    <div className={`flex flex-col flex-end w-full p-4 pt-0`}>
      <RecipeChat />
    </div>
  );
};
