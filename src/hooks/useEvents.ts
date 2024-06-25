import { GlobalContext } from "@/context/application";
import { AppEvent } from "@/types";
import { useContext } from "react";
import { BehaviorSubject, Subject } from "rxjs";

export const useEvents = () => {
  const subject = useEventSubject();
  return subject.asObservable();
};

export const useEventSubject = () => {
  const store = useContext(GlobalContext);
  let event$ = store.get()["event"] as Subject<AppEvent> | undefined;

  if (!event$) {
    event$ = new BehaviorSubject<AppEvent>({ type: "INIT" });
    store.setKey("event", event$);
  }

  return event$;
};
