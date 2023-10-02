"use client";

import { RecipeChatContext } from "@/components/recipe-chat";
import { useSelector } from "@/hooks/useSelector";
import { useContext } from "react";

export default function Header() {
  const actor = useContext(RecipeChatContext);
  const slug = useSelector(actor, (state) => state.context.slug);
  return <h1 className="px-4 text-lg font-semibold">{slug}</h1>;
}
