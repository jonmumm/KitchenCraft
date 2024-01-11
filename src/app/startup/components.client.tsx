"use client";

import { ServiceWorkerContext } from "@/context/service-worker";
import { useStore } from "@nanostores/react";
import { atom } from "nanostores";
import { ReactNode, createContext, useContext, useEffect } from "react";

const PushPermissionStateContext = createContext(
  atom<"granted" | "denied" | "prompt" | undefined>(undefined)
);

const usePushPermissionState = () => {
  const $ = useContext(PushPermissionStateContext);
  return useStore($);
};

export function PushPermissionState({ children }: { children: ReactNode }) {
  const permissionState$ = useContext(PushPermissionStateContext);
  const serviceWorker$ = useContext(ServiceWorkerContext);
  const PushPermissionStateListener = () => {
    const swReg = useStore(serviceWorker$);
    useEffect(() => {
      if (swReg) {
        swReg.pushManager
          .permissionState({ userVisibleOnly: true })
          .then(permissionState$.set);
      }
    }, [swReg]);
    return null;
  };

  return (
    <>
      <PushPermissionStateListener />
      {children}
    </>
  );
}

export function PushPermissionStateGranted({
  children,
}: {
  children: ReactNode;
}) {
  const permissionState = usePushPermissionState();
  return permissionState === "granted" ? <>{children}</> : null;
}

export function PushPermissionStateNotGranted({
  children,
}: {
  children: ReactNode;
}) {
  const permissionState = usePushPermissionState();
  return permissionState !== "denied" ? <>{children}</> : null;
}

export function PushNotificationStateLoading({
  children,
}: {
  children: ReactNode;
}) {
  const permissionState = usePushPermissionState();
  return permissionState === undefined ? <>{children}</> : null;
}
