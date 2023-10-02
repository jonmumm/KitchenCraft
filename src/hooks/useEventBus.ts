import { useEffect } from "react";
import type { Actor } from "xstate";
import { useEvents } from "./useEvent";

export const useEventBus = (actor: Actor<any>) => {
  const event$ = useEvents();

  useEffect(() => {
    const unsub = event$.subscribe((event) => actor.send(event as any));
    return () => {
      unsub();
    };
  }, [actor, event$]);
};
