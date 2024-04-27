"use client";

import { atom } from "nanostores";
import { ReactNode, useState } from "react";
import { ActorRefFrom, SnapshotFrom } from "xstate";
import { pageSessionMachine } from "./page-session-machine";
import { PageSessionContext } from "./page-session-store.context";

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
    <PageSessionContext.Provider value={session$}>
      {children}
    </PageSessionContext.Provider>
  );
};
