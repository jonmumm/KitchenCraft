"use client";

import { ServiceWorkerContext } from "@/context/service-worker";
import { env } from "@/env.public";
import { useEventHandler } from "@/hooks/useEventHandler";
import { useStore } from "@nanostores/react";
import { atom } from "nanostores";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
} from "react";

const PushNotificationContext = createContext({
  permissionState$: atom<"granted" | "denied" | "prompt" | undefined>(
    undefined
  ),
  subscription$: atom<PushSubscriptionJSON | undefined>(undefined),
});

export function PushNotificationProvider({
  children,
  registerPushSubscription,
  refreshPushSubscription,
}: {
  children: ReactNode;
  registerPushSubscription: (
    subscription: PushSubscriptionJSON
  ) => Promise<void>;
  refreshPushSubscription: (
    subscription: PushSubscriptionJSON
  ) => Promise<void>;
}) {
  const { permissionState$, subscription$ } = useContext(
    PushNotificationContext
  );

  const serviceWorker$ = useContext(ServiceWorkerContext);
  const handler = useCallback(() => {
    // useContext
    const swReg = serviceWorker$.get();
    if (!swReg) {
      throw new Error("todo implement wait when swReg not ready yet");
      // todo handle thi
    }

    // const permissionState = swReg.pushManager
    //   .permissionState({
    //     userVisibleOnly: true,
    //   })
    //   .then((permissionState) => {
    //     alert(permissionState);
    //   });

    swReg.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: env.VAPID_PUBLIC_KEY,
      })
      .then((subscription) => {
        return registerPushSubscription(subscription.toJSON());
      });
  }, [serviceWorker$, registerPushSubscription]);

  useEventHandler("ENABLE_PUSH_NOTIFICATIONS", handler);

  const PushManagerState = () => {
    const swReg = useStore(serviceWorker$);
    useEffect(() => {
      if (swReg) {
        Promise.all([
          swReg.pushManager.permissionState({ userVisibleOnly: true }),
          swReg.pushManager.getSubscription(),
        ]).then(([permissionState, subscription]) => {
          if (permissionState === "granted" && subscription) {
            refreshPushSubscription(subscription.toJSON());
          }
          permissionState$.set(permissionState);
          subscription$.set(subscription?.toJSON());
        });
      }
    }, [swReg]);

    return null;
  };

  return (
    <>
      <PushManagerState />
      {children}
    </>
  );

  // try {
  //     const subscription = await swReg.pushManager.subscribe({
  //       userVisibleOnly: true,
  //       applicationServerKey,
  //     });
  //   } catch (ex) {
  //     console.warn('error trying to subscribe', ex);
  //   }
}

const usePermissionState = () => {
  const { permissionState$ } = useContext(PushNotificationContext);
  return useStore(permissionState$);
};

export function PushNotificationsUnprompted({
  children,
}: {
  children: ReactNode;
}) {
  const permissionState = usePermissionState();
  return permissionState === "prompt" ? <>{children}</> : null;
}

export function PushNotificationsDenied({ children }: { children: ReactNode }) {
  const permissionState = usePermissionState();
  return permissionState === "denied" ? <>{children}</> : null;
}

// export function PushNotificationsGranted({
//   children,
// }: {
//   children: ReactNode;
// }) {
//   const permissionState = usePermissionState();
//   return permissionState === "granted" ? <>{children}</> : null;
// }
