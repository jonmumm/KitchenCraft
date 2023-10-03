import { AppEvent } from "@/types";
import { useEffect } from "react";
import { useEvents } from "./useEvents";

export const useEventHandler = <TEventType extends AppEvent["type"]>(
  type: TEventType,
  cb: (event: AppEvent) => void
) => {
  const event$ = useEvents();

  useEffect(() => {
    const unsub = event$.subscribe((event) => {
      if (event.type === type) {
        cb(event);
      }
    });
    return () => {
      unsub();
    };
  }, [event$, type]);
};
