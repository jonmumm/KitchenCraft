"use client";

import { RecipeChatContext } from "@/components/recipe-chat";
import { useSelector } from "@/hooks/useSelector";
import { useContext } from "react";

export default function Header() {
  const actor = useContext(RecipeChatContext);
  const name = useSelector(actor, (state) => state.context.recipe.name);
  const description = useSelector(actor, (state) => state.context.recipe.description);

  return (
    <div className="px-4">
      <h1 className="text-lg font-semibold">{name}</h1>
      <p className="text-md">{description}</p>
    </div>
  );
}
