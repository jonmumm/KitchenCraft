import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { useContext, useEffect, useMemo } from "react";
import { CraftContext } from "../context";

export const useCraftContext = () => {
  return useContext(CraftContext);
};

export const useKeyboardToggle = () => {
  const send = useSend();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        send({ type: "TOGGLE" });
      } else if (e.key === "Escape") {
        e.preventDefault();
        send({ type: "CLOSE" });
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [send]);
};

export const useIsMacDesktop = () => {
  return useMemo(() => /Mac|iMac|Macintosh/.test(navigator.platform), []);
};

export const useIngredients = () => {
  const actor = useContext(CraftContext);
  return useSelector(actor, (state) => state.context.ingredients);
};

export const useTags = () => {
  const actor = useContext(CraftContext);
  return useSelector(actor, (state) => state.context.tags);
};
