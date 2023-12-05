import posthog from "posthog-js";
import { useLayoutEffect, useRef, useState } from "react";
import { skip } from "rxjs";
import { useEvents } from "./useEvents";

export const usePosthogAnalytics = (posthogClientKey: string) => {
  const didSendInitialRef = useRef(false);

  const [client] = useState(() =>
    posthog.init(posthogClientKey, {
      api_host: "https://app.posthog.com",
    })
  );

  const event$ = useEvents();

  useLayoutEffect(() => {
    if (!client) {
      console.warn("unexpected missing posthog client");
      return;
    }

    // We expect 2 events initially
    const sub = event$
      .pipe(skip(!didSendInitialRef.current ? 0 : 2))
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
