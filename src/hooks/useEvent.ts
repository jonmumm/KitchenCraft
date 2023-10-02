import { ApplicationContext } from "@/context/application";
import { AppEvent } from "@/types";
import { ReadableAtom, atom } from "nanostores";
import { useContext } from "react";

export const useEvents = () => {
  const store = useContext(ApplicationContext);
  let event$ = store.get()["event"] as ReadableAtom<AppEvent> | undefined;

  if (!event$) {
    event$ = atom({ type: "INIT" });
    store.setKey("event", event$);
  }

  return event$;
};
