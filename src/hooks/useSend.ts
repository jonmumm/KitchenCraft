import { AppEvent } from "@/types";
import { useCallback } from "react";
import { useEventSubject } from "./useEvents";

export const useSend = () => {
  const subject = useEventSubject();

  const send = useCallback(
    (event: AppEvent) => {
      subject.next(event);
    },
    [subject]
  );

  return send;
};
