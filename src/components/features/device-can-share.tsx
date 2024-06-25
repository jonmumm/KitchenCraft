"use client";

import { ReactNode, useSyncExternalStore } from "react";

interface CanShareProps {
  children: ReactNode;
  serverValue?: boolean; // used in case we need to work with SSR to avoid flash
  not?: boolean;
}

const subscribe = (callback: () => void) => {
  // No need to subscribe to any event for this case
  return () => {};
};

const useCanShare = (serverValue: boolean) => {
  const getServerSnapshot = () => serverValue;
  const getClientSnapshot = () => "share" in navigator;

  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
};

const DeviceCanShare = ({ children, serverValue = false, not = false }: CanShareProps) => {
  const canShare = useCanShare(serverValue);

  if ((canShare && not) || (!canShare && !not)) {
    return null;
  }

  return <>{children}</>;
};

export default DeviceCanShare;