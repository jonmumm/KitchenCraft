import { CraftContext } from "@/app/context";
import { useContext } from "react";
import { useSelector } from "./useSelector";

export const useCraftIsOpen = () => {
  const actor = useContext(CraftContext);
  return useSelector(actor, (state) => state.matches("Open.True"));
};
