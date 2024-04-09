import { WritableAtom } from "nanostores";
import { createContext } from "react";
import { ActorRefFrom, SnapshotFrom } from "xstate";
import { pageSessionMachine } from "./page-session-machine";

export type SessionStoreSnapshot = SnapshotFrom<
  ActorRefFrom<typeof pageSessionMachine>
>; // todo make generic

export const SessionStoreContext = createContext(
  {} as WritableAtom<SessionStoreSnapshot>
);
