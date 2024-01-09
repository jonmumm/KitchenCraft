"use client";
import { useEffect, useRef } from "react";
import { Workbox, WorkboxLifecycleEvent } from "workbox-window";

declare global {
  interface Window {
    workbox: Workbox;
  }
}

export function PWALifeCycle() {
  const listenersAdded = useRef(false);

  useEffect(() => {
    if (
      !listenersAdded.current &&
      "serviceWorker" in navigator &&
      window.workbox
    ) {
      const wb = window.workbox;
      wb.register();

      const onInstalled = (event: WorkboxLifecycleEvent) => {
        console.log(`Event ${event.type} is triggered.`);
        console.log(event);
      };

      // const onWaiting = () => {
      //   if (
      //     confirm(
      //       "A newer version of this web app is available, reload to update?"
      //     )
      //   ) {
      //     wb.messageSkipWaiting();
      //     wb.addEventListener("controlling", () => {
      //       window.location.reload();
      //     });
      //   } else {
      //     console.log(
      //       "User rejected to update SW, keeping the old version. New version will be automatically loaded when the app is opened next time."
      //     );
      //   }
      // };

      const onControlling = (event: WorkboxLifecycleEvent) => {
        console.log(`Event ${event.type} is triggered.`);
        console.log(event);
      };

      const onActivated = (event: WorkboxLifecycleEvent) => {
        console.log(`Event ${event.type} is triggered.`);
        console.log(event);
      };

      wb.addEventListener("installed", onInstalled);
      // wb.addEventListener("waiting", onWaiting);
      wb.addEventListener("controlling", onControlling);
      wb.addEventListener("activated", onActivated);

      console.log("Event listeners added for PWA lifecycle.");
      listenersAdded.current = true;

      // No cleanup function is needed since we want these to persist
    }
  }, []);

  return <></>;
}
