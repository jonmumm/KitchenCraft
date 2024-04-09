"use client";

import { atom } from "nanostores";
import { ReactNode, useState } from "react";
import { ActorRefFrom, SnapshotFrom } from "xstate";
import { pageSessionMachine } from "./page-session-machine";
import { SessionStoreContext } from "./page-session-store.context";

export type SessionStoreSnapshot = SnapshotFrom<
  ActorRefFrom<typeof pageSessionMachine>
>; // todo make generic

export const SessionStoreProvider = ({
  initial,
  children,
}: {
  initial: SessionStoreSnapshot;
  children: ReactNode;
}) => {
  const [session$] = useState(atom(initial));

  return (
    <SessionStoreContext.Provider value={session$}>
      {children}
    </SessionStoreContext.Provider>
  );
};
