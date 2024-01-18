import { AppEvent } from "@/types";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useLayoutEffect, useRef, useState } from "react";
import { filter } from "rxjs";
import { useEvents } from "./useEvents";

const EVENTS_LOG_LEVEL_DEBUG = new Set([
  "SET_INPUT",
  "HYDRATE_INPUT", // blacklisted becuase it cant serialize this because it passes a ref, figure out hwo to handle
  "KEY_DOWN",
  "CHANGE",
]);
const isEventDebugLogLevel = (event: AppEvent) =>
  !EVENTS_LOG_LEVEL_DEBUG.has(event.type);

export const usePosthogAnalytics = (posthogClientKey: string) => {
  const didSendInitialRef = useRef(false);
  const session = useSession();
  const event$ = useEvents();

  const [client] = useState(() => {
    const client = posthog.init(posthogClientKey, {
      api_host: "https://app.posthog.com",
    });

    return client;
  });

  useLayoutEffect(() => {
    if (session.status === "authenticated") {
      const { email, name } = session.data.user;
      posthog.identify(session.data.user.id, { email, name });
    }
  }, [session]);

  useLayoutEffect(() => {
    if (!client) {
      console.warn("unexpected missing posthog client");
      return;
    }

    const sub = event$.pipe(filter(isEventDebugLogLevel)).subscribe((event) => {
      didSendInitialRef.current = true;
      if (process.env.NODE_ENV !== "production") {
        console.log(event);
      }
      // todo strip any sensistive data here
      // keep a roster of blackedlisted event/props (i.e. password)
      client.capture(event.type, event);
    });

    return () => {
      if (!sub.closed) {
        sub.unsubscribe();
      }
    };
  }, [event$, client, didSendInitialRef]);

  return client;
};
