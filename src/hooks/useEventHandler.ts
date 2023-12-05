import { AppEvent } from "@/types";
import { useEffect } from "react";
import { useEvents } from "./useEvents";

type ExtractAppEvent<T extends AppEvent["type"]> = AppEvent extends { type: T }
  ? AppEvent
  : never;

export const useEventHandler = <TEventType extends AppEvent["type"]>(
  type: TEventType,
  cb: (event: ExtractAppEvent<TEventType>) => void
) => {
  const event$ = useEvents();

  useEffect(() => {
    const sub = event$.subscribe((event) => {
      if (event.type === type) {
        cb(event as ExtractAppEvent<TEventType>);
      }
    });
    return () => {
      if (!sub.closed) {
        sub.unsubscribe();
      }
    };
  }, [event$, type, cb]);
};
