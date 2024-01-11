"use client";

import { ServiceWorkerContext } from "@/context/service-worker";
import { env } from "@/env.public";
import { useEventHandler } from "@/hooks/useEventHandler";
import { getErrorMessage } from "@/lib/error";
import { noop } from "@/lib/utils";
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
    // this shouldht happen since were holding the load state of the button
    // til swReg exists
    if (!swReg) {
      const unbind = serviceWorker$.listen((swReg) => {
        if (swReg) {
          prompt(swReg);
          unbind();
        }
      });
    } else {
      prompt(swReg);
    }

    function prompt(_swReg: ServiceWorkerRegistration) {
      alert("prompting");
      _swReg.pushManager
        .subscribe({
          userVisibleOnly: true,
          applicationServerKey: env.VAPID_PUBLIC_KEY,
        })
        .then((subscription) => {
          alert("subscribed, registering");
          return registerPushSubscription(subscription.toJSON());
        })
        .then(noop)
        .catch((ex) => {
          alert("exeception");
          alert(getErrorMessage(ex));
        });
    }
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
  const serviceWorker$ = useContext(ServiceWorkerContext);
  const serviceWorker = useStore(serviceWorker$);
  alert("has"+ !!serviceWorker);
  return serviceWorker && permissionState === "prompt" ? <>{children}</> : null;
}

export function PushNotificationsDenied({ children }: { children: ReactNode }) {
  const permissionState = usePermissionState();
  return permissionState === "denied" ? <>{children}</> : null;
}

export function PushNotificationStateLoading({
  children,
}: {
  children: ReactNode;
}) {
  const permissionState = usePermissionState();
  return permissionState === undefined ? <>{children}</> : null;
}

// export function PushNotificationsGranted({
//   children,
// }: {
//   children: ReactNode;
// }) {
//   const permissionState = usePermissionState();
//   return permissionState === "granted" ? <>{children}</> : null;
// }
