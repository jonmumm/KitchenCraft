import { AppEvent } from "@/types";
import { useSubscription } from "observable-hooks";
import { useState } from "react";
import { filter, skip } from "rxjs";
import { z } from "zod";
import { useEvents } from "./useEvents";

type SelectChoiceEvent = Extract<AppEvent, { type: "SELECT_CHOICE" }>;

type SchemaOrString = z.ZodEnum<[string, ...string[]]> | string;

export const useSelectChoiceEventHandler = <T extends SchemaOrString>(
  schemaOrString: T,
  cb: (event: SelectChoiceEvent & { name: T extends z.ZodEnum<any> ? z.infer<T> : T }) => void
) => {
  const event$ = useEvents();
  const [sub] = useState(
    event$.pipe(
      skip(1),
      filter((event): event is SelectChoiceEvent => {
        if (event.type !== "SELECT_CHOICE") return false;
        
        if (typeof schemaOrString === "string") {
          return event.name === schemaOrString;
        } else {
          return schemaOrString.safeParse(event.name).success;
        }
      })
    )
  );

  useSubscription(sub, (event) => {
    cb(event as SelectChoiceEvent & { name: T extends z.ZodEnum<any> ? z.infer<T> : T });
  });
};