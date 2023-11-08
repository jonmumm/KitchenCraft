import { useSend } from "@/hooks/useSend";
import { useEffect, useMemo } from "react";

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
