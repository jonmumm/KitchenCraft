import { AppEvent } from "@/types";
import { useSubscription } from "observable-hooks";
import { useState } from "react";
import { skip } from "rxjs";
import { useEvents } from "./useEvents";

type ExtractAppEvent<T extends AppEvent["type"]> = AppEvent extends infer U ? (U extends { type: T } ? U : never) : never;

export const useEventHandler = <TEventType extends AppEvent["type"]>(
  type: TEventType,
  cb: (event: ExtractAppEvent<TEventType>) => void
) => {
  const event$ = useEvents();
  const [sub] = useState(event$.pipe(skip(1)));
  useSubscription(sub, (event) => {
    if (event.type === type) {
      cb(event as ExtractAppEvent<TEventType>);
    }
  });
};
