"use client";

import { atom } from "nanostores";
import { ReactNode, useState } from "react";
import { ActorRefFrom, SnapshotFrom } from "xstate";
import { PageSessionMachine } from "./page-session-machine";
import { PageSessionContext } from "./page-session-store.context";

export type PageSessionStoreSnapshot = SnapshotFrom<
  ActorRefFrom<PageSessionMachine>
>; // todo make generic

export const PageSessionStoreProvider = ({
  initial,
  children,
}: {
  initial: PageSessionStoreSnapshot;
  children: ReactNode;
}) => {
  const [session$] = useState(atom(initial));

  return (
    <PageSessionContext.Provider value={session$}>
      {children}
    </PageSessionContext.Provider>
  );
};
