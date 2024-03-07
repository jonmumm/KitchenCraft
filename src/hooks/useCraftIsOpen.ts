import { CraftContext } from "@/app/context";
import { useContext } from "react";
import { useSelector } from "./useSelector";

export const useCraftIsOpen = () => {
  const actor = useContext(CraftContext);
  return useSelector(actor, (state) => state.matches({ Open: "True" }));
};

export const usePromptIsDirty = () => {
  const actor = useContext(CraftContext);
  return useSelector(actor, (state) => !!state.context.prompt?.length);
};

export const usePromptIsPristine = () => {
  const actor = useContext(CraftContext);
  return useSelector(actor, (state) => state.matches({ Prompt: "Pristine" }));
};
