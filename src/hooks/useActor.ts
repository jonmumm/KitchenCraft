import { ApplicationContext } from "@/context/application";
import { useStore } from "@nanostores/react";
import { useContext, useLayoutEffect, useState } from "react";
import { ActorRefFrom, AnyStateMachine, createActor } from "xstate";
import { useEvents } from "./useEvents";

export const useActor = <TMachine extends AnyStateMachine>(
  key: string,
  machine: TMachine
) => {
  const appStore = useContext(ApplicationContext);
  const event$ = useEvents();
  const appState = useStore(appStore, { keys: [key] });
  const existingActor = appState[key] as
    | ActorRefFrom<typeof machine>
    | undefined;

  const [actor] = useState(existingActor || createActor(machine));
  useLayoutEffect(() => {
    let unsub: () => void | undefined;
    if (!existingActor) {
      actor.start();
      unsub = event$.subscribe((event) => {
        actor.send(event as any);
      });
    }

    return () => {
      unsub && unsub();
    };
  }, [actor, event$]);

  return actor;
};
