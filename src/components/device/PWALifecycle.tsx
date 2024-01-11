"use client";

import { ServiceWorkerContext } from "@/context/service-worker";
import { useContext, useEffect, useRef } from "react";
import { Workbox, WorkboxLifecycleEvent } from "workbox-window";

declare global {
  interface Window {
    workbox: Workbox;
  }
}

export function PWALifeCycle() {
  const listenersAdded = useRef(false);
  const serviceWorker$ = useContext(ServiceWorkerContext);

  useEffect(() => {
    if (
      !listenersAdded.current &&
      "serviceWorker" in navigator &&
      window.workbox
    ) {
      // Programatically unregisters
      //       navigator.serviceWorker.getRegistrations().then(function(registrations) {
      //     for(let registration of registrations) {
      //         registration.unregister();
      //     }
      // });

      const wb = window.workbox;
      wb.register().then(async (swReg) => {
        if (swReg) {
          alert("service worker set");
          serviceWorker$.set(swReg);
        }
      });

      const onInstalled = (event: WorkboxLifecycleEvent) => {
        console.log(`Event ${event.type} is triggered.`);
        console.log(event);
      };

      // const onWaiting = (e: any) => {
      //   console.log("waiting", e);
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
        alert("active!");
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
  }, [serviceWorker$]);

  return <></>;
}
