import { AppEvent } from "@/types";
import { atom } from "nanostores";
import posthog from "posthog-js";
import { useLayoutEffect, useRef, useState } from "react";
import { filter } from "rxjs";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import { useEvents } from "./useEvents";
import { usePageSessionStore } from "./usePageSessionStore";

const EVENTS_LOG_LEVEL_DEBUG = new Set([
  "SET_INPUT",
  "HYDRATE_INPUT", // blacklisted becuase it cant serialize this because it passes a ref, figure out hwo to handle
  "MOUNT_CAROUSEL",
  "UNMOUNT_CAROUSEL",
  "KEY_DOWN",
  "CHANGE",
]);
const isEventDebugLogLevel = (event: AppEvent) =>
  !EVENTS_LOG_LEVEL_DEBUG.has(event.type);

export const usePosthogAnalytics = (posthogClientKey: string) => {
  const didSendInitialRef = useRef(false);
  // const session = useSession();
  const store = usePageSessionStore();
  const event$ = useEvents();

  const session$ = usePageSessionStore();
  const uniqueId = useSyncExternalStoreWithSelector(
    session$.subscribe,
    () => {
      return session$.get().context;
    },
    () => {
      return session$.get().context;
    },
    (context) => {
      return context.uniqueId;
    }
  );

  const [client] = useState(() => {
    const client = posthog.init(posthogClientKey, {
      api_host: "https://app.posthog.com",
      bootstrap: {
        distinctID: session$.get().context.uniqueId,
      },
    });

    return client;
  });

  useLayoutEffect(() => {
    posthog.identify(uniqueId);
  }, [uniqueId]);

  useLayoutEffect(() => {
    if (!client || initialized$.get()) {
      return;
    }
    initialized$.set(true);

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

const initialized$ = atom(false);
