import { AppEvent } from "@/types";
import { WritableAtom } from "nanostores";
import { useCallback } from "react";
import { useEvents } from "./useEvent";

export const useSend = () => {
  const event$ = useEvents() as WritableAtom<AppEvent>;

  const send = useCallback(
    (event: AppEvent) => {
      event$.set(event);
    },
    [event$]
  );

  return send;
};
