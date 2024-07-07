import { AppEvent } from "@/types";
import { useSubscription } from "observable-hooks";
import { useState } from "react";
import { filter, skip } from "rxjs";
import { useEvents } from "./useEvents";

type SubmitEvent = Extract<AppEvent, { type: "SUBMIT" }>;

export const useSubmitEventHandler = (
  name: string,
  cb: (event: SubmitEvent & { name: string }) => void
) => {
  const event$ = useEvents();
  const [sub] = useState(
    event$.pipe(
      skip(1),
      filter((event): event is SubmitEvent => {
        return event.type === "SUBMIT" && event.name === name;
      })
    )
  );
  useSubscription(sub, (event) => {
    cb(event as SubmitEvent & { name: string });
  });
};
