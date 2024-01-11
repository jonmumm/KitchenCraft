"use client";

import { atom } from "nanostores";
import { FC, ReactNode, createContext } from "react";

export const swRegStore = atom<ServiceWorkerRegistration | undefined>(
  undefined
);

export const ServiceWorkerContext = createContext(swRegStore);

export const ServiceWorkerProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <ServiceWorkerContext.Provider value={swRegStore}>
      {children}
    </ServiceWorkerContext.Provider>
  );
};
