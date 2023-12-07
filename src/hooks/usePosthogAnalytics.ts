import { AppEvent } from "@/types";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useLayoutEffect, useRef, useState } from "react";
import { filter, skip } from "rxjs";
import { useEvents } from "./useEvents";

// List of event types that we will not fire off
const BLACK_LIST = new Set(["SET_INPUT"]);
const isNotInBlackList = (event: AppEvent) => !BLACK_LIST.has(event.type);

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

    // We expect 2 events initially
    const sub = event$
      .pipe(skip(!didSendInitialRef.current ? 0 : 2), filter(isNotInBlackList))
      .subscribe((event) => {
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
};
